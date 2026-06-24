// ============================================================
// DataTable 공개 타입 + 내부 공유 타입.
// 공개 API(DataTable / DataTableColumn / ColumnState / SortState …)는
// 폴더 진입점 index.tsx 가 re-export → import 경로 불변.
// ============================================================

import type { ReactNode } from 'react';
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

// ============ Display cells (declarative, canvas-friendly) ============

/** 의미 톤 — 배지/태그/액션 버튼 색상 매핑 키. */
export type BadgeTone =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info';

/**
 * 선언적 표시 셀 — JSX 없이 canvas 위에 배지/태그/코드/색상텍스트/토글을 렌더.
 * 내부적으로 glide custom cell(TagsCell) · Boolean cell · Text+themeOverride 로 환원.
 * shadcn 의 `cell: () => <JSX/>` 를 대체하는 canvas-friendly 경로. `format` 보다 우선.
 */
/** status 표시 셀의 글리프 종류 — canvas 벡터 path 로 직접 그림 (아이콘-only 상태 컬럼용). */
export type StatusGlyph = 'check' | 'x' | 'clock' | 'spinner' | 'alert' | 'dot' | 'none';

export type DisplaySpec<T> =
  | {
      kind: 'badge';
      /** 배지 라벨 (미지정 시 셀 값 문자열). */
      label?: (value: unknown, row: T) => string;
      tone?: BadgeTone | ((value: unknown, row: T) => BadgeTone);
    }
  | {
      kind: 'tags';
      /** 행 → 표시할 태그 문자열 배열. */
      values: (row: T) => readonly string[];
      tone?: BadgeTone | ((tag: string, row: T) => BadgeTone);
    }
  | { kind: 'code' }
  | { kind: 'text'; color?: (value: unknown, row: T) => string }
  | { kind: 'toggle' }
  | {
      /** 아이콘/상태 글리프 셀 — lucide 대신 canvas 벡터 글리프 6종 + 선택 라벨. */
      kind: 'status';
      icon: (value: unknown, row: T) => StatusGlyph;
      tone?: BadgeTone | ((value: unknown, row: T) => BadgeTone);
      label?: (value: unknown, row: T) => string;
    };

/** 액션 실행 전 확인 단계 스펙. 문자열만 주면 description 으로 사용. */
export type ConfirmSpec = {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 확인 버튼 톤 (예: 'destructive'). */
  tone?: BadgeTone;
};

/** 액션 컬럼의 버튼 1개 (canvas 위 클릭 가능 영역). */
export type RowAction = {
  label: string;
  onClick: () => void;
  tone?: BadgeTone;
  disabled?: boolean;
  /** 지정 시 onClick 전에 확인 팝오버. 확인해야만 onClick 실행 (삭제 가드 등). */
  confirm?: string | ConfirmSpec;
};

/** 행별 부수효과 스위치 컬럼 설정 (읽기성 `display:'toggle'` 과 달리 onChange 콜백 보유). */
export type ToggleSpec<T> = {
  checked: (row: T) => boolean;
  onChange: (row: T, next: boolean) => void;
  disabled?: (row: T) => boolean;
  /** 진행 중 표시 + 클릭 무시. */
  busy?: (row: T) => boolean;
};

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

  /**
   * 선언적 표시 셀 (배지/태그/코드/색상텍스트/토글). JSX 없이 canvas 렌더.
   * `format` · select(dropdown) 보다 우선.
   */
  display?: DisplaySpec<T>;
  /**
   * 액션 컬럼 — 행마다 클릭 가능한 버튼 묶음. 이 컬럼은 자동으로 row-click 에서 제외됨
   * (`disableRowClick` 기본 true).
   */
  actions?: (row: T) => readonly RowAction[];
  /**
   * 행별 부수효과 스위치 컬럼. `display:'toggle'`(읽기 전용 체크박스) 와 달리 onChange
   * 콜백으로 즉시 반영. 자동으로 row-click 에서 제외됨.
   */
  toggle?: ToggleSpec<T>;
  /** 셀별 테마 override (배경/글자색/폰트 등). glide `themeOverride` 로 적용. */
  cellTheme?: (value: unknown, row: T) => Partial<Theme>;
  /** 이 컬럼 클릭은 `onRowClick` 을 트리거하지 않음 (액션/토글 컬럼용). */
  disableRowClick?: boolean;
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
  display: DisplaySpec<T> | undefined;
  actions: ((row: T) => readonly RowAction[]) | undefined;
  toggle: ToggleSpec<T> | undefined;
  cellTheme: ((value: unknown, row: T) => Partial<Theme>) | undefined;
  disableRowClick: boolean;
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

  /**
   * 행 클릭 콜백 — 클릭된 셀/컬럼과 무관하게 행 객체를 전달. drawer 열기·상세 이동 등.
   * `disableRowClick: true` 인 컬럼(액션/토글 등) 클릭은 제외된다.
   */
  onRowClick?: (row: T) => void;

  /** 로딩 오버레이 표시 (그리드 위에 반투명 레이어). */
  loading?: boolean;
  /** 데이터가 0행이고 `loading` 이 아닐 때 그리드 위에 표시할 내용. */
  emptyMessage?: ReactNode;
  /** 그리드 하단(상태바 위) footer 슬롯 — 페이저·요약 등 임의 React. */
  footer?: ReactNode;

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
  loading: string;
  confirm: string;
  cancel: string;
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
  loading: '불러오는 중…',
  confirm: '확인',
  cancel: '취소',
};
