// ============================================================
// DataTable<T> — Generic Glide Data Grid wrapper (AG-Grid Lite)
// ============================================================
// @glideapps/glide-data-grid(canvas 엔진) 위에 기능 레이어를 얹은 공통 테이블.
// shadcn / TanStack Table `ColumnDef<T>` 호환 column shape.
//
// Compatibility (drop-in column defs from shadcn):
//   accessorKey → row[accessorKey] / accessorFn → getter / header → title
//   size → width / enableSorting → sortable / enableHiding → hideable
// Native가 alias보다 우선.
//
// Render-model 한계: Glide = canvas. shadcn `cell: () => ReactNode` 같은 JSX cell
// renderer는 직접 못 받음. 대신 `format(value,row): Partial<GridCell>` 반환.
//
// 모듈 구성:
//   types.ts             공개/공유 타입
//   normalizeColumn.ts   컬럼 정규화
//   features/useColumnSizing  너비(구조와 분리된 독립 채널)
//   parts/ToolPanel · HeaderMenu · StatusBar  프레젠테이션
//   이 파일(index)        조립 오케스트레이터
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DataEditor,
  GridCellKind,
  type CellClickedEventArgs,
  type EditableGridCell,
  type GridCell,
  type GridColumn,
  type Item,
  type Rectangle,
} from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import { allCells } from '@glideapps/glide-data-grid-cells';
import badgeDropdownRenderer from '../cells/badge-dropdown-cell';

import {
  DEFAULT_LABELS,
  type ColumnState,
  type DataTableProps,
  type NormalizedColumn,
  type SortState,
} from './types';
import { normalizeColumn } from './normalizeColumn';
import { useColumnSizing } from './features/useColumnSizing';
import { ToolPanel } from './parts/ToolPanel';
import { HeaderMenu, type HeaderMenuState } from './parts/HeaderMenu';
import { StatusBar } from './parts/StatusBar';

// 공개 API re-export — import 경로 `@/components/ui/data-table` 불변 보장.
export type {
  SortDir,
  SortState,
  DataTableColumn,
  ColumnState,
  DataTableProps,
  DataTableLabels,
} from './types';

/** Glide custom cell renderers — 우리 badge-dropdown 우선 + 공식 extension all. */
const CUSTOM_RENDERERS = [badgeDropdownRenderer, ...allCells];

const EMPTY_TEXT: GridCell = {
  kind: GridCellKind.Text,
  data: '',
  displayData: '',
  allowOverlay: false,
};

export function DataTable<T>({
  data,
  columns: rawColumns,
  columnState: controlledState,
  onColumnStateChange,
  columnWidths,
  defaultColumnWidths,
  onColumnWidthsChange,
  sort: controlledSort,
  onSortChange,
  sortedData: externalSortedData,
  enableToolPanel = true,
  enableStatusBar = true,
  enableSort = true,
  enableHeaderMenu = true,
  onCellEdited,
  onCellContextMenu,
  onCellActivated,
  defaultColumnWidth = 140,
  rowMarkers,
  gridSelection,
  onGridSelectionChange,
  className = '',
  height = '100%',
  width = '100%',
  theme,
  labels: labelOverrides,
}: DataTableProps<T>) {
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...labelOverrides }), [labelOverrides]);

  // ---------- normalize columns once per columns ref ----------
  const columns = useMemo(() => rawColumns.map(normalizeColumn), [rawColumns]);

  const defById = useMemo(() => {
    const m = new Map<string, NormalizedColumn<T>>();
    for (const c of columns) m.set(c.id, c);
    return m;
  }, [columns]);

  // ---------- 컬럼 구조 상태(가시성·순서) — controlled or internal ----------
  const [internalState, setInternalState] = useState<ColumnState[]>(() =>
    columns.map((c) => ({
      id: c.id,
      width: c.width ?? defaultColumnWidth,
      visible: c.visible ?? true,
    })),
  );
  const columnState = controlledState ?? internalState;
  const setColumnState = useCallback(
    (updater: (prev: ColumnState[]) => ColumnState[]) => {
      if (controlledState) {
        onColumnStateChange?.(updater(controlledState));
      } else {
        setInternalState((prev) => {
          const next = updater(prev);
          onColumnStateChange?.(next);
          return next;
        });
      }
    },
    [controlledState, onColumnStateChange],
  );

  const visibleState = useMemo(
    () => columnState.filter((s) => s.visible && defById.has(s.id)),
    [columnState, defById],
  );

  // ---------- 컬럼 너비 — 구조와 분리된 독립 채널 ----------
  const { widths, applyResize } = useColumnSizing({
    columnWidths,
    defaultColumnWidths,
    onColumnWidthsChange,
  });

  // ---------- sort (controlled or internal) ----------
  const [internalSort, setInternalSort] = useState<SortState>(null);
  const sort = controlledSort ?? internalSort;
  const setSort = useCallback(
    (next: SortState) => {
      if (controlledSort !== undefined) onSortChange?.(next);
      else {
        setInternalSort(next);
        onSortChange?.(next);
      }
    },
    [controlledSort, onSortChange],
  );

  // ---------- sorted data (short-circuit when no sort) ----------
  const sortedData = useMemo<T[]>(() => {
    if (externalSortedData) return externalSortedData;
    if (!sort || !enableSort) return data;
    const def = defById.get(sort.id);
    if (!def) return data;
    const accessor = def.accessor;
    const dir = sort.dir;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (typeof av === 'number' && typeof bv === 'number') {
        return dir === 'asc' ? av - bv : bv - av;
      }
      return dir === 'asc'
        ? String(av ?? '').localeCompare(String(bv ?? ''))
        : String(bv ?? '').localeCompare(String(av ?? ''));
    });
    return copy;
  }, [externalSortedData, sort, enableSort, defById, data]);

  // ---------- pre-resolve visible cols (eliminates per-cell Map.get) ----------
  const visibleResolved = useMemo(
    () =>
      visibleState
        .map((s) => defById.get(s.id))
        .filter((c): c is NormalizedColumn<T> => Boolean(c)),
    [visibleState, defById],
  );

  // ---------- Glide columns (너비 = override → column def → default 순 폴백) ----------
  const gridColumns: GridColumn[] = useMemo(
    () =>
      visibleState.map((s) => {
        const def = defById.get(s.id)!;
        return {
          id: s.id,
          title: def.title,
          width: widths[s.id] ?? def.width ?? defaultColumnWidth,
          hasMenu: enableHeaderMenu,
        };
      }),
    [visibleState, defById, widths, defaultColumnWidth, enableHeaderMenu],
  );

  // ---------- select(dropdown) 컬럼 옵션 캐시 ----------
  const selectOptionsByCol = useMemo(() => {
    const m = new Map<string, readonly string[]>();
    for (const c of columns) {
      if (c.selectOptions == null) continue;
      const opts =
        typeof c.selectOptions === 'function' ? c.selectOptions(sortedData) : c.selectOptions;
      m.set(c.id, opts);
    }
    return m;
  }, [columns, sortedData]);

  // ---------- cell content (hot path) ----------
  const getCellContent = useCallback(
    ([col, row]: Item): GridCell => {
      const def = visibleResolved[col];
      if (!def) return EMPTY_TEXT;
      const rec = sortedData[row];
      if (rec == null) return EMPTY_TEXT;
      const value = def.accessor(rec);
      const editable = def.editable;

      // ── select(badge dropdown) 셀 ──
      const opts = selectOptionsByCol.get(def.id);
      if (opts && editable) {
        const str = value == null ? '' : String(value);
        return {
          kind: GridCellKind.Custom,
          allowOverlay: true,
          copyData: str,
          data: { kind: 'badge-dropdown-cell', value: str, allowedValues: opts },
        } as unknown as GridCell;
      }

      if (def.format) {
        const partial = def.format(value, rec);
        if (partial.kind) return partial as GridCell;
        const str = value == null ? '' : String(value);
        return {
          kind: GridCellKind.Text,
          data: str,
          displayData: str,
          allowOverlay: editable,
          readonly: !editable,
          ...partial,
        } as GridCell;
      }

      if (typeof value === 'number') {
        return {
          kind: GridCellKind.Number,
          data: value,
          displayData: String(value),
          allowOverlay: editable,
          readonly: !editable,
          contentAlign: def.align ?? 'right',
        };
      }

      const str = value == null ? '' : String(value);
      return {
        kind: GridCellKind.Text,
        data: str,
        displayData: str,
        allowOverlay: editable,
        readonly: !editable,
        contentAlign: def.align,
      };
    },
    [visibleResolved, sortedData, selectOptionsByCol],
  );

  // ---------- edit / activate / context-menu commit ----------
  const handleCellEdited = useCallback(
    (cell: Item, newValue: EditableGridCell) => {
      if (!onCellEdited) return;
      const [c, r] = cell;
      const def = visibleResolved[c];
      const rec = sortedData[r];
      if (!def || rec == null) return;
      onCellEdited({ row: rec, columnId: def.id, newValue });
    },
    [onCellEdited, visibleResolved, sortedData],
  );

  const handleCellActivated = useCallback(
    (cell: Item) => {
      if (!onCellActivated) return;
      const [c, r] = cell;
      const def = visibleResolved[c];
      const rec = sortedData[r];
      if (!def || rec == null) return;
      onCellActivated({ row: rec, columnId: def.id });
    },
    [onCellActivated, visibleResolved, sortedData],
  );

  const handleCellContextMenu = useCallback(
    (cell: Item, event: CellClickedEventArgs) => {
      if (!onCellContextMenu) return;
      const [c, r] = cell;
      const def = visibleResolved[c];
      const rec = sortedData[r];
      if (!def || rec == null) return;
      onCellContextMenu({ row: rec, columnId: def.id, event });
    },
    [onCellContextMenu, visibleResolved, sortedData],
  );

  // ---------- resize → 너비 채널 (드래그 중 시각만, 종료 시 1회 커밋) ----------
  const onColumnResize = useCallback(
    (column: GridColumn, newSize: number) => {
      if (column.id) applyResize(column.id, newSize, false);
    },
    [applyResize],
  );
  const onColumnResizeEnd = useCallback(
    (column: GridColumn, newSize: number) => {
      if (column.id) applyResize(column.id, newSize, true);
    },
    [applyResize],
  );

  // ---------- reorder (visible-index based) ----------
  const onColumnMoved = useCallback(
    (startIndex: number, endIndex: number) => {
      setColumnState((prev) => {
        const vis = prev.filter((s) => s.visible);
        const hid = prev.filter((s) => !s.visible);
        const next = [...vis];
        const [moved] = next.splice(startIndex, 1);
        next.splice(endIndex, 0, moved);
        return [...next, ...hid];
      });
    },
    [setColumnState],
  );

  // ---------- header click → sort ----------
  const onHeaderClicked = useCallback(
    (colIndex: number) => {
      if (!enableSort) return;
      const def = visibleResolved[colIndex];
      if (!def || !def.sortable) return;
      const colId = def.id;
      const next: SortState =
        sort?.id !== colId
          ? { id: colId, dir: 'asc' }
          : sort.dir === 'asc'
            ? { id: colId, dir: 'desc' }
            : null;
      setSort(next);
    },
    [enableSort, visibleResolved, sort, setSort],
  );

  // ---------- header menu ----------
  const [headerMenu, setHeaderMenu] = useState<HeaderMenuState | null>(null);
  const onHeaderMenuClick = useCallback(
    (colIndex: number, bounds: Rectangle) => {
      const def = visibleResolved[colIndex];
      if (def) setHeaderMenu({ colId: def.id, bounds });
    },
    [visibleResolved],
  );

  const hideColumn = useCallback(
    (id: string) => {
      setColumnState((prev) => prev.map((s) => (s.id === id ? { ...s, visible: false } : s)));
      setHeaderMenu(null);
    },
    [setColumnState],
  );
  const toggleColumn = useCallback(
    (id: string) =>
      setColumnState((prev) => prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))),
    [setColumnState],
  );

  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setHeaderMenu(null);
      }
    };
    if (headerMenu) document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [headerMenu]);

  // ---------- multi-cell copy ----------
  const getCellsForSelection = useCallback(
    (selection: Rectangle): readonly (readonly GridCell[])[] => {
      const result: GridCell[][] = [];
      for (let r = selection.y; r < selection.y + selection.height; r++) {
        const row: GridCell[] = [];
        for (let c = selection.x; c < selection.x + selection.width; c++) {
          row.push(getCellContent([c, r]));
        }
        result.push(row);
      }
      return result;
    },
    [getCellContent],
  );

  // ---------- DnD: tool panel chip 재배치 ----------
  const [draggedPanelId, setDraggedPanelId] = useState<string | null>(null);
  const [dragOverPanelId, setDragOverPanelId] = useState<string | null>(null);
  const onPanelDrop = useCallback(
    (targetId: string) => {
      if (!draggedPanelId || draggedPanelId === targetId) {
        setDraggedPanelId(null);
        setDragOverPanelId(null);
        return;
      }
      setColumnState((prev) => {
        const next = [...prev];
        const from = next.findIndex((s) => s.id === draggedPanelId);
        const to = next.findIndex((s) => s.id === targetId);
        if (from < 0 || to < 0) return prev;
        const [m] = next.splice(from, 1);
        next.splice(to, 0, m);
        return next;
      });
      setDraggedPanelId(null);
      setDragOverPanelId(null);
    },
    [draggedPanelId, setColumnState],
  );

  const titleFor = useCallback((id: string) => defById.get(id)?.title ?? id, [defById]);

  return (
    <div
      className={`w-full h-full bg-background text-foreground flex flex-col overflow-hidden ${className}`}
    >
      {enableToolPanel && (
        <ToolPanel
          columnState={columnState}
          defById={defById}
          draggedPanelId={draggedPanelId}
          dragOverPanelId={dragOverPanelId}
          setDraggedPanelId={setDraggedPanelId}
          setDragOverPanelId={setDragOverPanelId}
          onPanelDrop={onPanelDrop}
          toggleColumn={toggleColumn}
        />
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 overflow-hidden">
          <DataEditor
            columns={gridColumns}
            rows={sortedData.length}
            getCellContent={getCellContent}
            onColumnResize={onColumnResize}
            onColumnResizeEnd={onColumnResizeEnd}
            onColumnMoved={onColumnMoved}
            onHeaderClicked={onHeaderClicked}
            onHeaderMenuClick={enableHeaderMenu ? onHeaderMenuClick : undefined}
            onCellEdited={onCellEdited ? handleCellEdited : undefined}
            onCellContextMenu={onCellContextMenu ? handleCellContextMenu : undefined}
            onCellActivated={onCellActivated ? handleCellActivated : undefined}
            getCellsForSelection={getCellsForSelection}
            customRenderers={CUSTOM_RENDERERS}
            rangeSelect="multi-rect"
            columnSelect="multi"
            rowSelect="multi"
            rowMarkers={rowMarkers}
            gridSelection={gridSelection}
            onGridSelectionChange={onGridSelectionChange}
            smoothScrollX
            smoothScrollY
            width={width}
            height={height}
            theme={theme}
          />
        </div>

        {headerMenu && enableHeaderMenu && (
          <HeaderMenu
            menu={headerMenu}
            enableSort={enableSort}
            labels={labels}
            menuRef={menuRef}
            onSort={(dir) => {
              setSort(dir === null ? null : { id: headerMenu.colId, dir });
              setHeaderMenu(null);
            }}
            onHide={() => hideColumn(headerMenu.colId)}
          />
        )}
      </div>

      {enableStatusBar && (
        <StatusBar
          rowCount={sortedData.length}
          visibleCount={visibleState.length}
          totalCount={columnState.length}
          sort={sort}
          titleFor={titleFor}
          labels={labels}
        />
      )}
    </div>
  );
}

export default DataTable;
