// ============================================================
// Pager — 그리드 내장 페이지네이션 (이전 / 페이지번호+말줄임 / 다음)
// ============================================================
// 서버 페이지네이션용. 총 페이지 수를 모르므로 `hasMore` 로 다음 버튼 활성/말줄임을 판단한다.
// 소비자 CSS(Tailwind 등)에 의존하지 않도록 인라인 스타일로 자족 동작.
// ============================================================

import type { CSSProperties } from 'react';

export interface PagerProps {
  page: number;
  hasMore: boolean;
  loading?: boolean;
  onPageChange: (page: number) => void;
  /** 표시할 최대 페이지 버튼 수 (기본 5). */
  maxVisible?: number;
}

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

/** 현재 페이지 중앙 배치 + 필요 시 앞/뒤 말줄임. 마지막 페이지는 hasMore 로 추정. */
function generatePages(page: number, hasMore: boolean, maxVisible: number): PageItem[] {
  const last = page;
  if (last <= maxVisible && !hasMore) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, page - half);
  let end = start + maxVisible - 1;
  if (end > last && !hasMore) {
    end = last;
    start = Math.max(1, end - maxVisible + 1);
  }
  const pages: PageItem[] = [];
  const showStartEllipsis = start > 2;
  const showEndEllipsis = hasMore || end < last - 1;
  if (start > 1) {
    pages.push(1);
    if (showStartEllipsis) {
      pages.push('ellipsis-start');
      start++;
    }
  }
  for (let i = start; i <= end; i++) {
    if (i > 0 && (hasMore || i <= last)) pages.push(i);
  }
  if (showEndEllipsis) pages.push('ellipsis-end');
  return pages;
}

const WRAP: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 4,
  padding: '8px 4px',
};

const BTN_BASE: CSSProperties = {
  minWidth: 32,
  height: 32,
  padding: '0 8px',
  borderRadius: 6,
  // shorthand `border` 와 조건부 `borderColor` 를 섞으면 React 경고 → 개별 속성으로.
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '#e5e7eb',
  background: '#fff',
  color: '#374151',
  fontSize: 13,
  cursor: 'pointer',
  userSelect: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

function btnStyle(opts: { active?: boolean; disabled?: boolean }): CSSProperties {
  return {
    ...BTN_BASE,
    ...(opts.active ? { background: '#111827', color: '#fff', borderColor: '#111827' } : null),
    ...(opts.disabled ? { opacity: 0.4, cursor: 'not-allowed' } : null),
  };
}

export function Pager({ page, hasMore, loading = false, onPageChange, maxVisible = 5 }: PagerProps) {
  const pages = generatePages(page, hasMore, maxVisible);
  const canPrev = page > 1;
  const go = (p: number) => {
    if (p < 1 || loading) return;
    onPageChange(p);
  };
  return (
    <div style={{ ...WRAP, ...(loading ? { pointerEvents: 'none', opacity: 0.5 } : null) }}>
      <button type="button" style={btnStyle({ disabled: !canPrev })} disabled={!canPrev} onClick={() => go(page - 1)}>
        ‹
      </button>
      {pages.map((p, i) =>
        typeof p === 'number' ? (
          <button key={p} type="button" style={btnStyle({ active: p === page })} onClick={() => go(p)}>
            {p}
          </button>
        ) : (
          <span key={`${p}-${i}`} style={{ minWidth: 24, textAlign: 'center', color: '#9ca3af' }}>
            …
          </span>
        ),
      )}
      <button type="button" style={btnStyle({ disabled: !hasMore })} disabled={!hasMore} onClick={() => go(page + 1)}>
        ›
      </button>
    </div>
  );
}
