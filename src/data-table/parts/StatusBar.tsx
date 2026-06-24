// 하단 상태바 — row 수 · 보이는/전체 컬럼 수 · 현재 정렬.

import type { DataTableLabels, SortState } from '../types';

export type StatusBarProps = {
  rowCount: number;
  visibleCount: number;
  totalCount: number;
  sort: SortState;
  titleFor: (id: string) => string;
  labels: DataTableLabels;
};

export function StatusBar({ rowCount, visibleCount, totalCount, sort, titleFor, labels }: StatusBarProps) {
  return (
    <div className="px-4 py-2 border-t border-border bg-muted-shadcn/40 text-[11px] text-muted-shadcn-foreground flex items-center justify-between">
      <div>
        {rowCount} {labels.rows} · {visibleCount} / {totalCount} {labels.columns}
      </div>
      {sort && (
        <div>
          {labels.sort}:{' '}
          <span className="text-foreground">
            {titleFor(sort.id)} {sort.dir === 'asc' ? '↑' : '↓'}
          </span>
        </div>
      )}
    </div>
  );
}
