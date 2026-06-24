// ============================================================
// @hwani163/data-table — public entry (barrel)
// ============================================================
// DataTable<T> — @glideapps/glide-data-grid(canvas 엔진) 위에 기능 레이어
// (정렬 · 컬럼 너비 · 숨김/표시 · ToolPanel · StatusBar · HeaderMenu ·
//  badge-dropdown cell)를 얹은 공통 React 그리드. "AG-Grid Lite".
//
// shadcn / TanStack `ColumnDef<T>` 호환 column shape:
//   accessorKey → row[key] / accessorFn → getter / header → title
//   size → width / enableSorting → sortable / enableHiding → hideable
// ============================================================

export * from './data-table';
export { default } from './data-table';
export { DEFAULT_LABELS } from './data-table/types';
export type { NormalizedColumn } from './data-table/types';
