/**
 * <StatusCell> — 상태 글리프 custom cell. lucide 아이콘을 canvas 에 못 그리므로
 * 고정 글리프 6종(check/x/clock/spinner/alert/dot)을 벡터 path 로 직접 그린다.
 * glide 가 ctx 를 devicePixelRatio 로 미리 스케일하므로 레티나에서도 또렷.
 *
 * 데이터 스키마:
 *   { kind: 'status-cell', glyph, color, label? }
 */
import {
  GridCellKind,
  getMiddleCenterBias,
  type CustomCell,
  type CustomRenderer,
} from '@glideapps/glide-data-grid';
import type { StatusGlyph } from '../data-table/types';

interface StatusCellProps {
  readonly kind: 'status-cell';
  readonly glyph: StatusGlyph;
  readonly color: string;
  readonly label?: string;
}

export type StatusCell = CustomCell<StatusCellProps>;

const S = 14; // 글리프 한 변(px)

/** 글리프 1종을 (cx,cy) 중심, 크기 S, 색 color 로 그림. */
function drawGlyph(
  ctx: CanvasRenderingContext2D,
  glyph: StatusGlyph,
  cx: number,
  cy: number,
  color: string,
): void {
  const h = S / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.75;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (glyph) {
    case 'check': {
      ctx.beginPath();
      ctx.moveTo(cx - h * 0.7, cy);
      ctx.lineTo(cx - h * 0.1, cy + h * 0.6);
      ctx.lineTo(cx + h * 0.8, cy - h * 0.7);
      ctx.stroke();
      break;
    }
    case 'x': {
      ctx.beginPath();
      ctx.moveTo(cx - h * 0.6, cy - h * 0.6);
      ctx.lineTo(cx + h * 0.6, cy + h * 0.6);
      ctx.moveTo(cx + h * 0.6, cy - h * 0.6);
      ctx.lineTo(cx - h * 0.6, cy + h * 0.6);
      ctx.stroke();
      break;
    }
    case 'clock': {
      ctx.beginPath();
      ctx.arc(cx, cy, h * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - h * 0.55); // 분침
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + h * 0.45, cy + h * 0.1); // 시침
      ctx.stroke();
      break;
    }
    case 'spinner': {
      // 정적 호(arc) — 회전 애니메이션은 후속(주기적 invalidate 비용 큼)
      ctx.beginPath();
      ctx.arc(cx, cy, h * 0.8, -Math.PI * 0.5, Math.PI * 0.9);
      ctx.stroke();
      break;
    }
    case 'alert': {
      // 삼각형 + 느낌표
      ctx.beginPath();
      ctx.moveTo(cx, cy - h * 0.85);
      ctx.lineTo(cx + h * 0.85, cy + h * 0.7);
      ctx.lineTo(cx - h * 0.85, cy + h * 0.7);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - h * 0.2);
      ctx.lineTo(cx, cy + h * 0.25);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy + h * 0.55, 0.9, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'dot': {
      ctx.beginPath();
      ctx.arc(cx, cy, h * 0.55, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'none':
      break;
  }
  ctx.restore();
}

const renderer: CustomRenderer<StatusCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is StatusCell => (c.data as { kind?: unknown })?.kind === 'status-cell',
  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const { glyph, color, label } = cell.data;
    const x = rect.x + theme.cellHorizontalPadding;
    const cy = rect.y + rect.height / 2;

    if (glyph !== 'none') {
      drawGlyph(ctx, glyph, x + S / 2, cy, color);
    }

    if (label) {
      const font = `12px ${theme.fontFamily}`;
      ctx.font = font;
      ctx.fillStyle = theme.textDark;
      const textX = glyph === 'none' ? x : x + S + 6;
      ctx.fillText(label, textX, cy + getMiddleCenterBias(ctx, font));
    }
    return true;
  },
  measure: (ctx, cell, theme) => {
    const { glyph, label } = cell.data;
    const glyphW = glyph === 'none' ? 0 : S + 6;
    const labelW = label ? ctx.measureText(label).width : 0;
    return theme.cellHorizontalPadding * 2 + glyphW + labelW;
  },
};

export default renderer;
