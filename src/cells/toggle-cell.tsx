/**
 * <ToggleCell> — 행별 부수효과 스위치 custom cell (canvas).
 * `display:'toggle'`(읽기성 Boolean 체크박스) 와 달리, 클릭 시 `onChange(row, !checked)`
 * 를 부른다. actions-cell.tsx 의 draw/onClick hit-test 패턴을 복제.
 *
 * 데이터 스키마:
 *   { kind: 'toggle-cell', checked, disabled, busy, onToggle: () => void }
 *
 * - disabled/busy: 딤 + 클릭 무시 (busy 는 진행 중 의미로 트랙을 더 흐리게).
 * - 클릭은 onClick hit-test 로 처리하고 preventDefault → row-click/activate 와 분리.
 */
import {
  GridCellKind,
  type CustomCell,
  type CustomRenderer,
} from '@glideapps/glide-data-grid';

interface ToggleCellProps {
  readonly kind: 'toggle-cell';
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly busy: boolean;
  readonly onToggle: () => void;
}

export type ToggleCell = CustomCell<ToggleCellProps>;

const TRACK_W = 34;
const TRACK_H = 18;
const KNOB_R = 7;
const ON_COLOR = '#16a34a';
const OFF_COLOR = '#cbd5e1';

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

const renderer: CustomRenderer<ToggleCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is ToggleCell => (c.data as { kind?: unknown })?.kind === 'toggle-cell',
  needsHover: true,
  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const { checked, disabled, busy } = cell.data;
    const x = rect.x + theme.cellHorizontalPadding;
    const y = rect.y + (rect.height - TRACK_H) / 2;

    ctx.save();
    ctx.globalAlpha = disabled ? 0.4 : busy ? 0.6 : 1;

    // track
    ctx.fillStyle = checked ? ON_COLOR : OFF_COLOR;
    roundRect(ctx, x, y, TRACK_W, TRACK_H, TRACK_H / 2);
    ctx.fill();

    // knob
    const cx = checked ? x + TRACK_W - TRACK_H / 2 : x + TRACK_H / 2;
    const cy = y + TRACK_H / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, KNOB_R, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // busy 표시 — knob 중앙 작은 점
    if (busy) {
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = checked ? ON_COLOR : '#64748b';
      ctx.fill();
    }

    ctx.restore();
    return true;
  },
  measure: (_ctx, _cell, theme) => TRACK_W + theme.cellHorizontalPadding * 2,
  onClick: (args) => {
    const { cell, preventDefault } = args;
    const { disabled, busy, onToggle } = cell.data;
    if (!disabled && !busy) onToggle();
    preventDefault();
    return undefined;
  },
};

export default renderer;
