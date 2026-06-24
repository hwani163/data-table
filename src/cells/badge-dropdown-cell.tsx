/**
 * <BadgeDropdownCell> — single-select 셀. 디스플레이는 색상 뱃지(rounded chip),
 * 에디터는 Glide 공식 dropdown-cell 의 react-select overlay 를 재사용.
 *
 * 데이터 스키마:
 *   { kind: 'badge-dropdown-cell', value: string|null, allowedValues: readonly string[] }
 *
 * 색상은 라벨 hash → HSL 로 deterministic. 동일 라벨 = 동일 색.
 */
import {
  GridCellKind,
  getMiddleCenterBias,
  type CustomCell,
  type CustomRenderer,
} from '@glideapps/glide-data-grid';
import { DropdownCell as DropdownCellRenderer } from '@glideapps/glide-data-grid-cells';

interface BadgeDropdownCellProps {
  readonly kind: 'badge-dropdown-cell';
  readonly value: string | null | undefined;
  readonly allowedValues: readonly string[];
}

export type BadgeDropdownCell = CustomCell<BadgeDropdownCellProps>;

/** 모든 뱃지 동일 중립색. */
const BADGE_BG = '#eef1f5';
const BADGE_FG = '#374151';

const renderer: CustomRenderer<BadgeDropdownCell> = {
  kind: GridCellKind.Custom,
  isMatch: (c): c is BadgeDropdownCell =>
    (c.data as { kind?: unknown })?.kind === 'badge-dropdown-cell',
  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const text = cell.data.value ?? '';
    if (!text) return true;

    const padX = 8;
    const chipH = Math.min(rect.height - 6, 22);
    const m = ctx.measureText(text);
    const chipW = Math.min(m.width + padX * 2, rect.width - theme.cellHorizontalPadding * 2);
    const x = rect.x + theme.cellHorizontalPadding;
    const y = rect.y + (rect.height - chipH) / 2;

    // rounded rect background
    const r = chipH / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + chipW - r, y);
    ctx.quadraticCurveTo(x + chipW, y, x + chipW, y + r);
    ctx.lineTo(x + chipW, y + chipH - r);
    ctx.quadraticCurveTo(x + chipW, y + chipH, x + chipW - r, y + chipH);
    ctx.lineTo(x + r, y + chipH);
    ctx.quadraticCurveTo(x, y + chipH, x, y + chipH - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = BADGE_BG;
    ctx.fill();

    // text
    ctx.fillStyle = BADGE_FG;
    ctx.fillText(
      text,
      x + padX,
      y + chipH / 2 + getMiddleCenterBias(ctx, theme),
    );

    return true;
  },
  measure: (ctx, cell, theme) => {
    const text = cell.data.value ?? '';
    return (text ? ctx.measureText(text).width : 0) + theme.cellHorizontalPadding * 2 + 24;
  },
  // Editor 는 Glide 공식 dropdown-cell 과 동일 — react-select overlay 재사용.
  // dropdown-cell 의 Editor 는 cell.data.value / allowedValues 만 읽으므로 duck-typing OK.
  // onFinishedEditing 도 spread 만 해서 우리 kind 'badge-dropdown-cell' 보존.
  provideEditor: DropdownCellRenderer.provideEditor as CustomRenderer<BadgeDropdownCell>['provideEditor'],
  onPaste: (v, d) => ({
    ...d,
    value: d.allowedValues.includes(v) ? v : d.value,
  }),
};

export default renderer;
