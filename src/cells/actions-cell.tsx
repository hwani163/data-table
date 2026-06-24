/**
 * <ActionsCell> — 행마다 클릭 가능한 버튼 묶음을 canvas 위에 렌더하는 custom cell.
 * shadcn 의 액션 컬럼(`<Button>` Run/Delete/Edit …)을 canvas-friendly 하게 대체.
 *
 * 데이터 스키마:
 *   { kind: 'actions-cell', actions: { label, onClick, tone?, disabled? }[] }
 *
 * 클릭 처리: glide CustomRenderer.onClick 이 주는 cell-상대 posX 로 어느 버튼이
 * 눌렸는지 히트테스트. draw 와 onClick 이 동일한 `layout()`(ctx 불필요·결정적)을
 * 공유하므로 그린 위치와 클릭 영역이 항상 일치한다. lucide 아이콘은 canvas 에
 * 직접 못 그리므로 짧은 텍스트 라벨을 사용 (canvas 제약에 정직한 선택).
 */
import {
  GridCellKind,
  getMiddleCenterBias,
  type CustomCell,
  type CustomRenderer,
} from '@glideapps/glide-data-grid';

type ActionTone = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info';

/** 확인 단계 스펙 (types.ts ConfirmSpec 와 구조 호환). */
type ActionConfirm =
  | string
  | {
      title?: string;
      description?: string;
      confirmLabel?: string;
      cancelLabel?: string;
      tone?: ActionTone;
    };

/** hit 된 액션 버튼의 셀-절대(canvas) 좌표 — 확인 팝오버 앵커. */
export interface ActionAnchor {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface ActionButton {
  readonly label: string;
  readonly onClick: () => void;
  readonly tone?: ActionTone;
  readonly disabled?: boolean;
  readonly confirm?: ActionConfirm;
}

interface ActionsCellProps {
  readonly kind: 'actions-cell';
  readonly actions: readonly ActionButton[];
  /**
   * confirm 있는 액션 클릭 시 onClick 대신 호출 — DataTable 이 DOM 확인 팝오버를 띄움.
   * 미지정(또는 confirm 없는 액션)이면 즉시 onClick (v0.2 동작).
   */
  readonly requestConfirm?: (action: ActionButton, anchor: ActionAnchor) => void;
}

export type ActionsCell = CustomCell<ActionsCellProps>;

const TONE_BG: Record<ActionTone, string> = {
  default: '#eef1f5',
  secondary: '#e5e7eb',
  success: '#dcfce7',
  warning: '#fef9c3',
  destructive: '#fee2e2',
  info: '#dbeafe',
};
const TONE_FG: Record<ActionTone, string> = {
  default: '#374151',
  secondary: '#374151',
  success: '#166534',
  warning: '#854d0e',
  destructive: '#991b1b',
  info: '#1e40af',
};

const PAD = 6; // 셀 좌우 패딩
const GAP = 6; // 버튼 간 간격
const BTN_PAD = 8; // 버튼 내부 좌우 패딩
const CHAR_W = 6.6; // 12px 폰트 글자폭 추정 — ctx 없는 onClick 에서도 결정적 hit-test
const BTN_H = 22;
const RADIUS = 4;

/** 버튼 i 의 셀-상대 {start, w} 레이아웃. draw·measure·onClick 공유 (순수함수). */
function layout(actions: readonly ActionButton[]): { start: number; w: number }[] {
  const out: { start: number; w: number }[] = [];
  let x = PAD;
  for (const a of actions) {
    const w = Math.ceil(a.label.length * CHAR_W) + BTN_PAD * 2;
    out.push({ start: x, w });
    x += w + GAP;
  }
  return out;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const renderer: CustomRenderer<ActionsCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is ActionsCell => (c.data as { kind?: unknown })?.kind === 'actions-cell',
  needsHover: true,
  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const { actions } = cell.data;
    if (actions.length === 0) return true;
    const rects = layout(actions);
    const y = rect.y + (rect.height - BTN_H) / 2;
    const font = `12px ${theme.fontFamily}`;
    ctx.save();
    ctx.font = font;
    for (let i = 0; i < actions.length; i++) {
      const a = actions[i];
      const { start, w } = rects[i];
      const x = rect.x + start;
      ctx.globalAlpha = a.disabled ? 0.4 : 1;
      ctx.fillStyle = TONE_BG[a.tone ?? 'default'];
      roundRect(ctx, x, y, w, BTN_H, RADIUS);
      ctx.fill();
      ctx.fillStyle = TONE_FG[a.tone ?? 'default'];
      ctx.fillText(a.label, x + BTN_PAD, y + BTN_H / 2 + getMiddleCenterBias(ctx, font));
    }
    ctx.restore();
    return true;
  },
  measure: (_ctx, cell) => {
    const rects = layout(cell.data.actions);
    const last = rects[rects.length - 1];
    return (last ? last.start + last.w : 0) + PAD;
  },
  onClick: (args) => {
    const { cell, posX, bounds, preventDefault } = args;
    const { actions, requestConfirm } = cell.data;
    const rects = layout(actions);
    for (let i = 0; i < actions.length; i++) {
      const { start, w } = rects[i];
      if (posX >= start && posX <= start + w) {
        const a = actions[i];
        preventDefault();
        if (a.disabled) break;
        if (a.confirm && requestConfirm) {
          // onClick 대신 확인 요청 — hit 버튼의 canvas 절대 rect 를 앵커로 전달.
          const y = bounds.y + (bounds.height - BTN_H) / 2;
          requestConfirm(a, { x: bounds.x + start, y, w, h: BTN_H });
        } else {
          a.onClick();
        }
        break;
      }
    }
    return undefined;
  },
};

export default renderer;
