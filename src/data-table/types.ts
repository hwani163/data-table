// ============================================================
// DataTable 공개 타입 + 내부 공유 타입.
// 공개 API(DataTable / DataTableColumn / ColumnState / SortState …)는
// 폴더 진입점 index.tsx 가 re-export → import 경로 불변.
// ============================================================

import type {
  CellClickedEventArgs,
  EditableGridCell,
  GridCell,
  GridSelection,
  Theme,
} from '@glideapps/glide-data-grid';

// ============ Sort ============

export type SortDir = 'asc' | 'desc';
export type SortState = { id: string; dir: SortDir } | null;

// ============ Column def ============

/**
 * shadcn/TanStack `ColumnDef<T>` 호환 + native 확장.
 * 최소 필드: `id` 또는 `accessorKey` 중 하나는 필수.
 */
export type DataTableColumn<T> = {
  // ---- shadcn / TanStack aliases ----
  accessorKey?: keyof T & string;
  accessorFn?: (row: T) => unknown;
  header?: string;
  size?: number;
  enableSorting?: boolean;
  enableHiding?: boolean;

  // ---- native ----
  id?: string;
  title?: string;
  width?: number;
  visible?: boolean;
  /** array-row 인덱스 (T = unknown[] 일 때) */
  index?: number;
  accessor?: (row: T) => unknown;
  /** custom cell builder. `partial.kind` 미지정 시 Text 셀에 머지 */
  format?: (value: unknown, row: T) => Partial<GridCell>;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  hideable?: boolean;
  /**
   * 인라인 편집 활성. true 시 Glide overlay editor 오픈 + `readonly: false`,
   * `allowOverlay: true` 로 설정. 값 반영은 상위 `onCellEdited` 콜백.
   */
  editable?: boolean;
  /**
   * 셀을 dropdown(select) 셀로 만든다. 정적 배열 또는 현재 행으로부터 옵션을
   * 도출하는 함수. `editable: true` + `selectOptions` 동시 설정해야 의미 있음.
   * Glide 의 badge-dropdown 커스텀 셀 사용. 외부 부수효과: `customRenderers` 자동 주입.
   */
  selectOptions?: readonly string[] | ((rows: readonly T[]) => readonly string[]);
};

/** 정규화된 컬럼 — 내부 모듈 공유용. */
export type NormalizedColumn<T> = {
  id: string;
  title: string;
  width: number | undefined;
  visible: boolean | undefined;
  accessor: (row: T) => unknown;
  format: ((value: unknown, row: T) => Partial<GridCell>) | undefined;
  align: 'left' | 'right' | 'center' | undefined;
  sortable: boolean;
  hideable: boolean;
  editable: boolean;
  selectOptions: readonly string[] | ((rows: readonly T[]) => readonly string[]) | undefined;
};

// ============ Runtime state ============

/**
 * 컬럼 **구조** 상태 (가시성 + 순서). 너비는 분리 채널(useColumnSizing)로 관리하므로
 * 여기서의 `width` 는 레거시 호환 필드일 뿐 렌더 너비의 source 가 아니다.
 */
export type ColumnState = {
  id: string;
  width: number;
  visible: boolean;
};

// ============ Props ============

export type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];

  /** 선택적 controlled 컬럼 **구조**(가시성·순서). 없으면 내부 state. */
  columnState?: ColumnState[];
  onColumnStateChange?: (next: ColumnState[]) => void;

  /**
   * 컬럼 너비. **구조(가시성·순서)와 완전 분리된 독립 채널**.
   * React 표준 controlled/uncontrolled 이원화:
   *  - `columnWidths` 지정 → controlled (부모 소유, `onColumnWidthsChange` 로 반영)
   *  - 미지정 → uncontrolled 내부 state, `defaultColumnWidths` 로 seed
   * 키는 컬럼 `id`. 값은 px. 여기 없는 컬럼은 column def `width` → `defaultColumnWidth` 순으로 폴백.
   *
   * 너비를 `columnState` 에 싣지 않는 이유: 너비 없는 모델(예: colConfig=visible idx[])로
   * round-trip 하는 호출처에서 resize 가 매번 기본값으로 리셋되는 버그를 구조적으로 차단.
   */
  columnWidths?: Record<string, number>;
  defaultColumnWidths?: Record<string, number>;
  onColumnWidthsChange?: (next: Record<string, number>) => void;

  /** 선택적 controlled 정렬 */
  sort?: SortState;
  onSortChange?: (next: SortState) => void;

  /** caller가 직접 정렬한 데이터. 있으면 내부 sort 무시 */
  sortedData?: T[];

  enableToolPanel?: boolean;
  enableStatusBar?: boolean;
  enableSort?: boolean;
  enableHeaderMenu?: boolean;

  /**
   * 인라인 편집 커밋 콜백. Glide overlay editor 확정 시 호출.
   * `column.editable=true` 인 셀에만 열림. 내부에서 visible-col → columnId,
   * sortedData[row] → row 로 해석해 전달.
   */
  onCellEdited?: (args: { row: T; columnId: string; newValue: EditableGridCell }) => void;

  /**
   * 셀 우클릭 콜백. caller 는 `event.preventDefault()` 로 기본 메뉴 차단 가능.
   */
  onCellContextMenu?: (args: { row: T; columnId: string; event: CellClickedEventArgs }) => void;

  /**
   * 셀 클릭(activate) 콜백. 액션 컬럼(삭제 × 등) 구현용. `editable: false` 컬럼에서도
   * 호출됨. Glide 기본 더블클릭이 아닌 single activate 시점.
   */
  onCellActivated?: (args: { row: T; columnId: string }) => void;

  defaultColumnWidth?: number;

  /**
   * Glide 기본 row marker (체크박스/번호) 컬럼. 기본 `'none'`.
   * `'checkbox'` + `rowSelect="multi"` (이미 켜짐) 조합으로 다중 row 선택 UI 자동 제공.
   * `'both'` 는 번호 + 체크박스 동시.
   */
  rowMarkers?: 'none' | 'number' | 'checkbox' | 'both' | 'clickable-number';

  /**
   * Controlled row/cell/column selection state. 미지정 시 Glide 내부 state.
   * `gridSelection.rows` 의 `CompactSelection` 으로 선택된 row 인덱스 조회 가능.
   */
  gridSelection?: GridSelection;
  onGridSelectionChange?: (next: GridSelection) => void;

  className?: string;
  height?: number | string;
  width?: number | string;

  theme?: Partial<Theme>;

  labels?: Partial<DataTableLabels>;
};

export type DataTableLabels = {
  hiddenColumns: string;
  dropToHide: string;
  restore: string;
  sortAsc: string;
  sortDesc: string;
  sortClear: string;
  hide: string;
  rows: string;
  columns: string;
  sort: string;
};

export const DEFAULT_LABELS: DataTableLabels = {
  hiddenColumns: '숨긴 컬럼',
  dropToHide: '↓ 여기에 드롭하여 숨기기',
  restore: '그리드로 복원',
  sortAsc: '오름차순 정렬',
  sortDesc: '내림차순 정렬',
  sortClear: '정렬 해제',
  hide: '컬럼 숨기기',
  rows: 'rows',
  columns: 'columns',
  sort: '정렬',
};
