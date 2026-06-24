import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { GridCellKind, getMiddleCenterBias, DataEditor } from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import { DropdownCell, allCells } from '@glideapps/glide-data-grid-cells';
import { GripVertical, Check, ArrowUp, ArrowDown, X, EyeOff } from 'lucide-react';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';

// src/data-table/index.tsx
var BADGE_BG = "#eef1f5";
var BADGE_FG = "#374151";
var renderer = {
  kind: GridCellKind.Custom,
  isMatch: (c) => c.data?.kind === "badge-dropdown-cell",
  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const text = cell.data.value ?? "";
    if (!text) return true;
    const padX = 8;
    const chipH = Math.min(rect.height - 6, 22);
    const m = ctx.measureText(text);
    const chipW = Math.min(m.width + padX * 2, rect.width - theme.cellHorizontalPadding * 2);
    const x = rect.x + theme.cellHorizontalPadding;
    const y = rect.y + (rect.height - chipH) / 2;
    const r = chipH / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + chipW - r, y);
    ctx.quadraticCurveTo(x + chipW, y, x + chipW, y + r);
    ctx.lineTo(x + chipW, y + chipH - r);
    ctx.quadraticCurveTo(x + chipW, y + chipH, x + chipW - r, y + chipH);
    ctx.lineTo(x + r, y + chipH);
    ctx.quadraticCurveTo(x, y + chipH, x, y + chipH - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = BADGE_BG;
    ctx.fill();
    ctx.fillStyle = BADGE_FG;
    ctx.fillText(
      text,
      x + padX,
      y + chipH / 2 + getMiddleCenterBias(ctx, theme)
    );
    return true;
  },
  measure: (ctx, cell, theme) => {
    const text = cell.data.value ?? "";
    return (text ? ctx.measureText(text).width : 0) + theme.cellHorizontalPadding * 2 + 24;
  },
  // Editor 는 Glide 공식 dropdown-cell 과 동일 — react-select overlay 재사용.
  // dropdown-cell 의 Editor 는 cell.data.value / allowedValues 만 읽으므로 duck-typing OK.
  // onFinishedEditing 도 spread 만 해서 우리 kind 'badge-dropdown-cell' 보존.
  provideEditor: DropdownCell.provideEditor,
  onPaste: (v, d) => ({
    ...d,
    value: d.allowedValues.includes(v) ? v : d.value
  })
};
var badge_dropdown_cell_default = renderer;

// src/data-table/types.ts
var DEFAULT_LABELS = {
  hiddenColumns: "\uC228\uAE34 \uCEEC\uB7FC",
  dropToHide: "\u2193 \uC5EC\uAE30\uC5D0 \uB4DC\uB86D\uD558\uC5EC \uC228\uAE30\uAE30",
  restore: "\uADF8\uB9AC\uB4DC\uB85C \uBCF5\uC6D0",
  sortAsc: "\uC624\uB984\uCC28\uC21C \uC815\uB82C",
  sortDesc: "\uB0B4\uB9BC\uCC28\uC21C \uC815\uB82C",
  sortClear: "\uC815\uB82C \uD574\uC81C",
  hide: "\uCEEC\uB7FC \uC228\uAE30\uAE30",
  rows: "rows",
  columns: "columns",
  sort: "\uC815\uB82C"
};

// src/data-table/normalizeColumn.ts
function normalizeColumn(c) {
  const id = c.id ?? c.accessorKey;
  if (!id) throw new Error("DataTableColumn requires `id` or `accessorKey`");
  const accessor = c.accessor ?? c.accessorFn ?? (c.index !== void 0 ? /* @__PURE__ */ ((i) => (r) => r[i])(c.index) : c.accessorKey ? /* @__PURE__ */ ((k) => (r) => r[k])(c.accessorKey) : /* @__PURE__ */ ((k) => (r) => r[k])(id));
  return {
    id,
    title: c.title ?? c.header ?? id,
    width: c.width ?? c.size,
    visible: c.visible,
    accessor,
    format: c.format,
    align: c.align,
    sortable: c.sortable ?? c.enableSorting ?? true,
    hideable: c.hideable ?? c.enableHiding ?? true,
    editable: c.editable ?? false,
    selectOptions: c.selectOptions
  };
}
function useColumnSizing(opts) {
  const { columnWidths, defaultColumnWidths, onColumnWidthsChange } = opts;
  const isControlled = columnWidths !== void 0;
  const [internal, setInternal] = useState(
    () => ({ ...defaultColumnWidths ?? {} })
  );
  const widths = isControlled ? columnWidths : internal;
  const applyResize = useCallback(
    (id, width, commit) => {
      if (isControlled) {
        onColumnWidthsChange?.({ ...columnWidths, [id]: width });
        return;
      }
      setInternal((prev) => {
        const next = { ...prev, [id]: width };
        if (commit) onColumnWidthsChange?.(next);
        return next;
      });
    },
    [isControlled, columnWidths, onColumnWidthsChange]
  );
  return { widths, applyResize };
}
function ToolPanel({
  columnState,
  defById,
  draggedPanelId,
  dragOverPanelId,
  setDraggedPanelId,
  setDragOverPanelId,
  onPanelDrop,
  toggleColumn
}) {
  return /* @__PURE__ */ jsx("div", { className: "border-b border-border bg-muted-shadcn/30 max-h-[220px] overflow-auto", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 px-3 py-2", children: columnState.map((s) => {
    const def = defById.get(s.id);
    if (!def) return null;
    return /* @__PURE__ */ jsxs(
      "div",
      {
        draggable: true,
        onDragStart: () => setDraggedPanelId(s.id),
        onDragOver: (e) => {
          e.preventDefault();
          if (s.id !== draggedPanelId) setDragOverPanelId(s.id);
        },
        onDrop: () => onPanelDrop(s.id),
        onDragEnd: () => {
          setDraggedPanelId(null);
          setDragOverPanelId(null);
        },
        className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs cursor-grab active:cursor-grabbing ${draggedPanelId === s.id ? "opacity-40 border-border" : dragOverPanelId === s.id ? "border-primary bg-accent-shadcn" : s.visible ? "border-border bg-background hover:bg-accent-shadcn/60" : "border-dashed border-border bg-muted-shadcn/50 text-muted-shadcn-foreground"}`,
        children: [
          /* @__PURE__ */ jsx(GripVertical, { size: 11, className: "text-muted-shadcn-foreground shrink-0" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => def.hideable !== false && toggleColumn(s.id),
              className: `w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${s.visible ? "bg-primary border-primary" : "border-border"} ${def.hideable === false ? "opacity-40 cursor-not-allowed" : ""}`,
              disabled: def.hideable === false,
              "aria-label": s.visible ? "hide" : "show",
              children: s.visible && /* @__PURE__ */ jsx(Check, { size: 9, className: "text-primary-foreground", strokeWidth: 3 })
            }
          ),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: `truncate ${s.visible ? "text-foreground" : "text-muted-shadcn-foreground"}`,
              children: def.title
            }
          )
        ]
      },
      s.id
    );
  }) }) });
}
function HeaderMenu({ menu, enableSort, labels, menuRef, onSort, onHide }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: menuRef,
      style: {
        // Glide `screenPosition` 은 viewport(window) 좌표 → fixed 로 직접 매핑.
        // absolute + 컨테이너 상대 좌표는 grid 가 스크롤되거나 컨테이너가 작은 경우
        // 메뉴가 엉뚱한 위치(테이블 바닥) 에 뜸.
        position: "fixed",
        top: menu.bounds.y + menu.bounds.height,
        left: menu.bounds.x,
        zIndex: 50
      },
      className: "w-44 rounded-md border border-border bg-popover shadow-2xl py-1 text-xs",
      children: [
        enableSort && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(MenuItem, { icon: /* @__PURE__ */ jsx(ArrowUp, { size: 12 }), label: labels.sortAsc, onClick: () => onSort("asc") }),
          /* @__PURE__ */ jsx(
            MenuItem,
            {
              icon: /* @__PURE__ */ jsx(ArrowDown, { size: 12 }),
              label: labels.sortDesc,
              onClick: () => onSort("desc")
            }
          ),
          /* @__PURE__ */ jsx(MenuItem, { icon: /* @__PURE__ */ jsx(X, { size: 12 }), label: labels.sortClear, onClick: () => onSort(null) }),
          /* @__PURE__ */ jsx("div", { className: "h-px bg-border my-1" })
        ] }),
        /* @__PURE__ */ jsx(MenuItem, { icon: /* @__PURE__ */ jsx(EyeOff, { size: 12 }), label: labels.hide, onClick: onHide })
      ]
    }
  );
}
function MenuItem({
  icon,
  label,
  onClick
}) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick,
      className: "w-full px-3 py-1.5 flex items-center gap-2 text-left hover:bg-accent-shadcn text-foreground",
      children: [
        /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: icon }),
        /* @__PURE__ */ jsx("span", { children: label })
      ]
    }
  );
}
function StatusBar({ rowCount, visibleCount, totalCount, sort, titleFor, labels }) {
  return /* @__PURE__ */ jsxs("div", { className: "px-4 py-2 border-t border-border bg-muted-shadcn/40 text-[11px] text-muted-shadcn-foreground flex items-center justify-between", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      rowCount,
      " ",
      labels.rows,
      " \xB7 ",
      visibleCount,
      " / ",
      totalCount,
      " ",
      labels.columns
    ] }),
    sort && /* @__PURE__ */ jsxs("div", { children: [
      labels.sort,
      ":",
      " ",
      /* @__PURE__ */ jsxs("span", { className: "text-foreground", children: [
        titleFor(sort.id),
        " ",
        sort.dir === "asc" ? "\u2191" : "\u2193"
      ] })
    ] })
  ] });
}
var CUSTOM_RENDERERS = [badge_dropdown_cell_default, ...allCells];
var EMPTY_TEXT = {
  kind: GridCellKind.Text,
  data: "",
  displayData: "",
  allowOverlay: false
};
function DataTable({
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
  className = "",
  height = "100%",
  width = "100%",
  theme,
  labels: labelOverrides
}) {
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...labelOverrides }), [labelOverrides]);
  const columns = useMemo(() => rawColumns.map(normalizeColumn), [rawColumns]);
  const defById = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const c of columns) m.set(c.id, c);
    return m;
  }, [columns]);
  const [internalState, setInternalState] = useState(
    () => columns.map((c) => ({
      id: c.id,
      width: c.width ?? defaultColumnWidth,
      visible: c.visible ?? true
    }))
  );
  const columnState = controlledState ?? internalState;
  const setColumnState = useCallback(
    (updater) => {
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
    [controlledState, onColumnStateChange]
  );
  const visibleState = useMemo(
    () => columnState.filter((s) => s.visible && defById.has(s.id)),
    [columnState, defById]
  );
  const { widths, applyResize } = useColumnSizing({
    columnWidths,
    defaultColumnWidths,
    onColumnWidthsChange
  });
  const [internalSort, setInternalSort] = useState(null);
  const sort = controlledSort ?? internalSort;
  const setSort = useCallback(
    (next) => {
      if (controlledSort !== void 0) onSortChange?.(next);
      else {
        setInternalSort(next);
        onSortChange?.(next);
      }
    },
    [controlledSort, onSortChange]
  );
  const sortedData = useMemo(() => {
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
      if (typeof av === "number" && typeof bv === "number") {
        return dir === "asc" ? av - bv : bv - av;
      }
      return dir === "asc" ? String(av ?? "").localeCompare(String(bv ?? "")) : String(bv ?? "").localeCompare(String(av ?? ""));
    });
    return copy;
  }, [externalSortedData, sort, enableSort, defById, data]);
  const visibleResolved = useMemo(
    () => visibleState.map((s) => defById.get(s.id)).filter((c) => Boolean(c)),
    [visibleState, defById]
  );
  const gridColumns = useMemo(
    () => visibleState.map((s) => {
      const def = defById.get(s.id);
      return {
        id: s.id,
        title: def.title,
        width: widths[s.id] ?? def.width ?? defaultColumnWidth,
        hasMenu: enableHeaderMenu
      };
    }),
    [visibleState, defById, widths, defaultColumnWidth, enableHeaderMenu]
  );
  const selectOptionsByCol = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const c of columns) {
      if (c.selectOptions == null) continue;
      const opts = typeof c.selectOptions === "function" ? c.selectOptions(sortedData) : c.selectOptions;
      m.set(c.id, opts);
    }
    return m;
  }, [columns, sortedData]);
  const getCellContent = useCallback(
    ([col, row]) => {
      const def = visibleResolved[col];
      if (!def) return EMPTY_TEXT;
      const rec = sortedData[row];
      if (rec == null) return EMPTY_TEXT;
      const value = def.accessor(rec);
      const editable = def.editable;
      const opts = selectOptionsByCol.get(def.id);
      if (opts && editable) {
        const str2 = value == null ? "" : String(value);
        return {
          kind: GridCellKind.Custom,
          allowOverlay: true,
          copyData: str2,
          data: { kind: "badge-dropdown-cell", value: str2, allowedValues: opts }
        };
      }
      if (def.format) {
        const partial = def.format(value, rec);
        if (partial.kind) return partial;
        const str2 = value == null ? "" : String(value);
        return {
          kind: GridCellKind.Text,
          data: str2,
          displayData: str2,
          allowOverlay: editable,
          readonly: !editable,
          ...partial
        };
      }
      if (typeof value === "number") {
        return {
          kind: GridCellKind.Number,
          data: value,
          displayData: String(value),
          allowOverlay: editable,
          readonly: !editable,
          contentAlign: def.align ?? "right"
        };
      }
      const str = value == null ? "" : String(value);
      return {
        kind: GridCellKind.Text,
        data: str,
        displayData: str,
        allowOverlay: editable,
        readonly: !editable,
        contentAlign: def.align
      };
    },
    [visibleResolved, sortedData, selectOptionsByCol]
  );
  const handleCellEdited = useCallback(
    (cell, newValue) => {
      if (!onCellEdited) return;
      const [c, r] = cell;
      const def = visibleResolved[c];
      const rec = sortedData[r];
      if (!def || rec == null) return;
      onCellEdited({ row: rec, columnId: def.id, newValue });
    },
    [onCellEdited, visibleResolved, sortedData]
  );
  const handleCellActivated = useCallback(
    (cell) => {
      if (!onCellActivated) return;
      const [c, r] = cell;
      const def = visibleResolved[c];
      const rec = sortedData[r];
      if (!def || rec == null) return;
      onCellActivated({ row: rec, columnId: def.id });
    },
    [onCellActivated, visibleResolved, sortedData]
  );
  const handleCellContextMenu = useCallback(
    (cell, event) => {
      if (!onCellContextMenu) return;
      const [c, r] = cell;
      const def = visibleResolved[c];
      const rec = sortedData[r];
      if (!def || rec == null) return;
      onCellContextMenu({ row: rec, columnId: def.id, event });
    },
    [onCellContextMenu, visibleResolved, sortedData]
  );
  const onColumnResize = useCallback(
    (column, newSize) => {
      if (column.id) applyResize(column.id, newSize, false);
    },
    [applyResize]
  );
  const onColumnResizeEnd = useCallback(
    (column, newSize) => {
      if (column.id) applyResize(column.id, newSize, true);
    },
    [applyResize]
  );
  const onColumnMoved = useCallback(
    (startIndex, endIndex) => {
      setColumnState((prev) => {
        const vis = prev.filter((s) => s.visible);
        const hid = prev.filter((s) => !s.visible);
        const next = [...vis];
        const [moved] = next.splice(startIndex, 1);
        next.splice(endIndex, 0, moved);
        return [...next, ...hid];
      });
    },
    [setColumnState]
  );
  const onHeaderClicked = useCallback(
    (colIndex) => {
      if (!enableSort) return;
      const def = visibleResolved[colIndex];
      if (!def || !def.sortable) return;
      const colId = def.id;
      const next = sort?.id !== colId ? { id: colId, dir: "asc" } : sort.dir === "asc" ? { id: colId, dir: "desc" } : null;
      setSort(next);
    },
    [enableSort, visibleResolved, sort, setSort]
  );
  const [headerMenu, setHeaderMenu] = useState(null);
  const onHeaderMenuClick = useCallback(
    (colIndex, bounds) => {
      const def = visibleResolved[colIndex];
      if (def) setHeaderMenu({ colId: def.id, bounds });
    },
    [visibleResolved]
  );
  const hideColumn = useCallback(
    (id) => {
      setColumnState((prev) => prev.map((s) => s.id === id ? { ...s, visible: false } : s));
      setHeaderMenu(null);
    },
    [setColumnState]
  );
  const toggleColumn = useCallback(
    (id) => setColumnState((prev) => prev.map((s) => s.id === id ? { ...s, visible: !s.visible } : s)),
    [setColumnState]
  );
  const menuRef = useRef(null);
  useEffect(() => {
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setHeaderMenu(null);
      }
    };
    if (headerMenu) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [headerMenu]);
  const getCellsForSelection = useCallback(
    (selection) => {
      const result = [];
      for (let r = selection.y; r < selection.y + selection.height; r++) {
        const row = [];
        for (let c = selection.x; c < selection.x + selection.width; c++) {
          row.push(getCellContent([c, r]));
        }
        result.push(row);
      }
      return result;
    },
    [getCellContent]
  );
  const [draggedPanelId, setDraggedPanelId] = useState(null);
  const [dragOverPanelId, setDragOverPanelId] = useState(null);
  const onPanelDrop = useCallback(
    (targetId) => {
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
    [draggedPanelId, setColumnState]
  );
  const titleFor = useCallback((id) => defById.get(id)?.title ?? id, [defById]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `w-full h-full bg-background text-foreground flex flex-col overflow-hidden ${className}`,
      children: [
        enableToolPanel && /* @__PURE__ */ jsx(
          ToolPanel,
          {
            columnState,
            defById,
            draggedPanelId,
            dragOverPanelId,
            setDraggedPanelId,
            setDragOverPanelId,
            onPanelDrop,
            toggleColumn
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-1 overflow-hidden relative", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-hidden", children: /* @__PURE__ */ jsx(
            DataEditor,
            {
              columns: gridColumns,
              rows: sortedData.length,
              getCellContent,
              onColumnResize,
              onColumnResizeEnd,
              onColumnMoved,
              onHeaderClicked,
              onHeaderMenuClick: enableHeaderMenu ? onHeaderMenuClick : void 0,
              onCellEdited: onCellEdited ? handleCellEdited : void 0,
              onCellContextMenu: onCellContextMenu ? handleCellContextMenu : void 0,
              onCellActivated: onCellActivated ? handleCellActivated : void 0,
              getCellsForSelection,
              customRenderers: CUSTOM_RENDERERS,
              rangeSelect: "multi-rect",
              columnSelect: "multi",
              rowSelect: "multi",
              rowMarkers,
              gridSelection,
              onGridSelectionChange,
              smoothScrollX: true,
              smoothScrollY: true,
              width,
              height,
              theme
            }
          ) }),
          headerMenu && enableHeaderMenu && /* @__PURE__ */ jsx(
            HeaderMenu,
            {
              menu: headerMenu,
              enableSort,
              labels,
              menuRef,
              onSort: (dir) => {
                setSort(dir === null ? null : { id: headerMenu.colId, dir });
                setHeaderMenu(null);
              },
              onHide: () => hideColumn(headerMenu.colId)
            }
          )
        ] }),
        enableStatusBar && /* @__PURE__ */ jsx(
          StatusBar,
          {
            rowCount: sortedData.length,
            visibleCount: visibleState.length,
            totalCount: columnState.length,
            sort,
            titleFor,
            labels
          }
        )
      ]
    }
  );
}
var data_table_default = DataTable;

export { DEFAULT_LABELS, DataTable, data_table_default as default };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map