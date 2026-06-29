/**
 * <BadgeButtonCell> — 클릭 가능한 단일 배지(pill) custom cell.
 * `display:'badge'` + `onClick`(+선택적 `clickable`) 일 때 사용. 일반 표시 배지(TagsCell)와
 * 달리 클릭을 히트테스트해 onClick 을 실행하고 row-click 을 막는다(preventDefault).
 *
 * 데이터 스키마: { kind:'badge-button-cell', label, bg, fg, onClick }
 * actions-cell 의 pill 드로잉/히트테스트 패턴을 그대로 따른다(draw·onClick 이 동일 layout 공유).
 */
import {
  GridCellKind,
  getMiddleCenterBias,
  type CustomCell,
  type CustomRenderer,
} from '@glideapps/glide-data-grid';

interface BadgeButtonCellProps {
  readonly kind: 'badge-button-cell';
  readonly label: string;
  readonly bg: string;
  readonly fg: string;
  readonly onClick: () => void;
}

export type BadgeButtonCell = CustomCell<BadgeButtonCellProps>;

const PAD = 6; // 셀 좌측 패딩
const BTN_PAD = 8; // pill 내부 좌우 패딩
const CHAR_W = 6.6; // 12px 글자폭 추정 (ctx 없는 onClick 결정적 hit-test)
const H = 22;
const RADIUS = 11; // 알약형

function pillWidth(label: string): number {
  return Math.ceil(label.length * CHAR_W) + BTN_PAD * 2;
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

const renderer: CustomRenderer<BadgeButtonCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is BadgeButtonCell =>
    (c.data as { kind?: unknown })?.kind === 'badge-button-cell',
  needsHover: true,
  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const { label, bg, fg } = cell.data;
    if (!label) return true;
    const w = pillWidth(label);
    const x = rect.x + PAD;
    const y = rect.y + (rect.height - H) / 2;
    const font = `12px ${theme.fontFamily}`;
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = bg;
    roundRect(ctx, x, y, w, H, RADIUS);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.fillText(label, x + BTN_PAD, y + H / 2 + getMiddleCenterBias(ctx, font));
    ctx.restore();
    return true;
  },
  measure: (_ctx, cell) => pillWidth(cell.data.label) + PAD * 2,
  onClick: (args) => {
    const { cell, posX, preventDefault } = args;
    const w = pillWidth(cell.data.label);
    if (posX >= PAD && posX <= PAD + w) {
      preventDefault();
      cell.data.onClick();
    }
    return undefined;
  },
};

export default renderer;
