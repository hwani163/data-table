/**
 * <ConfirmPopover> — 액션 confirm 용 DOM 확인 팝오버.
 * canvas 위에 못 올리므로 document.body 포털(부모에서)로 fixed 배치된다.
 * Tailwind 비의존 인라인 스타일 — 소비자 환경 무관 동작.
 *
 * 동작: 마운트 시 확인 버튼 포커스, Esc·바깥 클릭 → onCancel.
 * 위치(x,y)는 페이지 좌표(클릭 버튼 하단). 화면 우/하단 넘침은 간단 클램프.
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

export type ConfirmPopoverProps = {
  x: number;
  y: number;
  title?: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  toneColor: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const CARD: CSSProperties = {
  position: 'fixed',
  zIndex: 9999,
  minWidth: 200,
  maxWidth: 320,
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
  padding: 12,
  fontSize: 13,
  color: '#111827',
};

const BTN: CSSProperties = {
  fontSize: 12,
  lineHeight: '20px',
  padding: '4px 12px',
  borderRadius: 6,
  border: '1px solid #e5e7eb',
  cursor: 'pointer',
  background: '#fff',
  color: '#374151',
};

export function ConfirmPopover({
  x,
  y,
  title,
  description,
  confirmLabel,
  cancelLabel,
  toneColor,
  onConfirm,
  onCancel,
}: ConfirmPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<CSSProperties>({ left: x, top: y });

  // 화면 넘침 클램프 (마운트 후 실제 크기로 보정)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    let left = x;
    let top = y;
    if (left + r.width > window.innerWidth - margin) left = window.innerWidth - r.width - margin;
    if (top + r.height > window.innerHeight - margin) top = y - r.height - 24; // 위로 뒤집기
    setPos({ left: Math.max(margin, left), top: Math.max(margin, top) });
  }, [x, y]);

  useEffect(() => {
    confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onCancel();
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('mousedown', onDown, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('mousedown', onDown, true);
    };
  }, [onCancel]);

  return (
    <div ref={ref} style={{ ...CARD, ...pos }} role="dialog" aria-modal="true">
      {title && <div style={{ fontWeight: 600, marginBottom: description ? 4 : 10 }}>{title}</div>}
      {description && <div style={{ color: '#4b5563', marginBottom: 10 }}>{description}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" style={BTN} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          type="button"
          ref={confirmBtnRef}
          style={{ ...BTN, background: toneColor, borderColor: toneColor, color: '#fff' }}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

export default ConfirmPopover;
