// ============================================================
// useColumnSizing — 컬럼 너비 전용 상태 훅 (구조와 분리).
// ============================================================
// React 표준 controlled/uncontrolled 이원화:
//   - columnWidths 지정      → controlled (부모 소유)
//   - 미지정 + defaultWidths → uncontrolled 내부 state
//
// applyResize(id, w, commit):
//   - 드래그 중(onColumnResize)        → commit=false: 시각만 갱신, onChange 미발화
//   - 드래그 종료(onColumnResizeEnd)   → commit=true : onChange 발화(영속/동기화 1회)
//   controlled 모드는 부모가 매 프레임 반영해야 하므로 항상 onChange 발화.
//
// 반환 widths 는 "override 맵"일 뿐, 여기 없는 컬럼의 폴백(column def width →
// defaultColumnWidth)은 호출처(gridColumns 조립)에서 처리한다.
// ============================================================

import { useCallback, useState } from 'react';

export type UseColumnSizingOptions = {
  columnWidths?: Record<string, number>;
  defaultColumnWidths?: Record<string, number>;
  onColumnWidthsChange?: (next: Record<string, number>) => void;
};

export type UseColumnSizingResult = {
  /** 컬럼 id → 너비(px) override 맵. */
  widths: Record<string, number>;
  /** 너비 반영. commit=true 일 때만 onColumnWidthsChange 발화. */
  applyResize: (id: string, width: number, commit: boolean) => void;
};

export function useColumnSizing(opts: UseColumnSizingOptions): UseColumnSizingResult {
  const { columnWidths, defaultColumnWidths, onColumnWidthsChange } = opts;
  const isControlled = columnWidths !== undefined;

  const [internal, setInternal] = useState<Record<string, number>>(
    () => ({ ...(defaultColumnWidths ?? {}) }),
  );

  const widths = isControlled ? columnWidths : internal;

  const applyResize = useCallback(
    (id: string, width: number, commit: boolean) => {
      if (isControlled) {
        // 부모가 source of truth — 매 호출 onChange 로 위임(시각/영속 모두 부모 책임).
        onColumnWidthsChange?.({ ...columnWidths, [id]: width });
        return;
      }
      setInternal((prev) => {
        const next = { ...prev, [id]: width };
        if (commit) onColumnWidthsChange?.(next);
        return next;
      });
    },
    [isControlled, columnWidths, onColumnWidthsChange],
  );

  return { widths, applyResize };
}
