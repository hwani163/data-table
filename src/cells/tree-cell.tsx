/**
 * <TreeCell> — 트리(펼침/접기) 셀. canvas 위에 들여쓰기 + chevron(▶/▼) + 선택적 작은
 * 배지들 + 라벨(말줄임)을 그린다. chevron 영역 클릭만 onToggle 을 실행하고 preventDefault
 * 하므로, 그 외 영역 클릭은 row-click(상세 열기 등)으로 통과한다.
 *
 * 데이터 스키마:
 *   { kind:'tree-cell', level, expandable, expanded, label, badges:[{text,bg,fg}], onToggle }
 *
 * glide 는 canvas 라 트리/그룹이 내장 없음 → 행 평탄화는 소비 측 책임(부모/자식 flat rows),
 * 이 셀은 "들여쓰기 + 토글 affordance" 만 담당한다.
 */
import {
  GridCellKind,
  getMiddleCenterBias,
  type CustomCell,
  type CustomRenderer,
} from '@glideapps/glide-data-grid';

interface TreeBadge {
  readonly text: string;
  readonly bg: string;
  readonly fg: string;
}

interface TreeCellProps {
  readonly kind: 'tree-cell';
  readonly level: number;
  readonly expandable: boolean;
  readonly expanded: boolean;
  readonly label: string;
  readonly badges: readonly TreeBadge[];
  readonly onToggle: () => void;
}

export type TreeCell = CustomCell<TreeCellProps>;

const PAD = 8; // 셀 좌측 패딩
const INDENT = 16; // 레벨당 들여쓰기
const CHEVRON = 16; // chevron 드로잉/히트 박스 너비 (자식 정렬 위해 항상 예약)
const GAP = 6; // 배지 간격
const BADGE_PAD = 6;
const BADGE_H = 17;
const CHAR_W = 6.6;
const RADIUS = 8;
const CHEVRON_COLOR = '#6b7280';

function badgeWidth(text: string): number {
  return Math.ceil(text.length * CHAR_W) + BADGE_PAD * 2;
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

const renderer: CustomRenderer<TreeCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is TreeCell => (c.data as { kind?: unknown })?.kind === 'tree-cell',
  needsHover: true,
  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const { level, expandable, expanded, label, badges } = cell.data;
    const cy = rect.y + rect.height / 2;
    const font = `${theme.baseFontStyle ?? '13px'} ${theme.fontFamily}`;
    let x = rect.x + PAD + level * INDENT;

    ctx.save();
    ctx.font = font;

    // chevron (▶ 접힘 / ▼ 펼침). 그 자리는 자식 정렬을 위해 항상 예약.
    if (expandable) {
      const cx = x + CHEVRON / 2;
      const s = 4;
      ctx.fillStyle = CHEVRON_COLOR;
      ctx.beginPath();
      if (expanded) {
        ctx.moveTo(cx - s, cy - s / 2);
        ctx.lineTo(cx + s, cy - s / 2);
        ctx.lineTo(cx, cy + s);
      } else {
        ctx.moveTo(cx - s / 2, cy - s);
        ctx.lineTo(cx + s, cy);
        ctx.lineTo(cx - s / 2, cy + s);
      }
      ctx.closePath();
      ctx.fill();
    }
    x += CHEVRON;

    // 작은 배지 pill 들
    for (const b of badges) {
      const w = badgeWidth(b.text);
      ctx.fillStyle = b.bg;
      roundRect(ctx, x, cy - BADGE_H / 2, w, BADGE_H, RADIUS);
      ctx.fill();
      ctx.fillStyle = b.fg;
      ctx.fillText(b.text, x + BADGE_PAD, cy + getMiddleCenterBias(ctx, font));
      x += w + GAP;
    }

    // 라벨 (남는 폭에 말줄임)
    ctx.fillStyle = theme.textDark;
    const maxX = rect.x + rect.width - PAD;
    let text = label;
    if (x + ctx.measureText(text).width > maxX) {
      const ell = '…';
      while (text.length > 1 && x + ctx.measureText(text + ell).width > maxX) {
        text = text.slice(0, -1);
      }
      text += ell;
    }
    ctx.fillText(text, x, cy + getMiddleCenterBias(ctx, font));
    ctx.restore();
    return true;
  },
  measure: (_ctx, cell) => {
    const { level, badges, label } = cell.data;
    let w = PAD + level * INDENT + CHEVRON;
    for (const b of badges) w += badgeWidth(b.text) + GAP;
    w += Math.ceil(label.length * CHAR_W) + PAD;
    return w;
  },
  onClick: (args) => {
    const { cell, posX, preventDefault } = args;
    const { level, expandable, onToggle } = cell.data;
    if (!expandable) return undefined;
    const start = PAD + level * INDENT;
    if (posX >= start && posX <= start + CHEVRON) {
      preventDefault();
      onToggle();
    }
    return undefined;
  },
};

export default renderer;
