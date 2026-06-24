// ============================================================
// displayCell — 선언적 DisplaySpec → glide GridCell 환원
// ============================================================
// canvas 위에서 JSX 없이 배지/태그/코드/색상텍스트/토글을 렌더한다.
//   badge · tags → glide 공식 TagsCell (검증된 custom cell, 직접 draw 안 함)
//   code · text  → Text cell + themeOverride (mono 폰트 / 글자색)
//   toggle       → native Boolean cell (canvas-honest 체크박스)
// ============================================================

import { GridCellKind, type GridCell, type Theme } from '@glideapps/glide-data-grid';
import type { BadgeTone, DisplaySpec } from './types';

/** 톤 → pill 배경색. TagsCell 이 이 색을 배경으로, theme.textDark 를 글자로 그림. */
const TONE_BG: Record<BadgeTone, string> = {
  default: '#eef1f5',
  secondary: '#e5e7eb',
  success: '#dcfce7',
  warning: '#fef9c3',
  destructive: '#fee2e2',
  info: '#dbeafe',
};

export function toneColor(tone: BadgeTone | undefined): string {
  return TONE_BG[tone ?? 'default'];
}

/** 톤 → 진한 단색(stroke/fill). status 글리프·확인 버튼 등 "선/채움" 용도. */
const TONE_SOLID: Record<BadgeTone, string> = {
  default: '#374151',
  secondary: '#6b7280',
  success: '#16a34a',
  warning: '#d97706',
  destructive: '#dc2626',
  info: '#2563eb',
};

export function toneSolid(tone: BadgeTone | undefined): string {
  return TONE_SOLID[tone ?? 'default'];
}

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** TagsCell GridCell 빌더 (badge = 태그 1개). */
function tagsCell(
  tags: readonly string[],
  colorFor: (tag: string) => string,
  themeOverride: Partial<Theme> | undefined,
): GridCell {
  return {
    kind: GridCellKind.Custom,
    allowOverlay: false,
    copyData: tags.join(', '),
    themeOverride,
    data: {
      kind: 'tags-cell',
      tags,
      possibleTags: tags.map((t) => ({ tag: t, color: colorFor(t) })),
    },
  } as unknown as GridCell;
}

export function buildDisplayCell<T>(
  spec: DisplaySpec<T>,
  value: unknown,
  row: T,
  editable: boolean,
  themeOverride: Partial<Theme> | undefined,
): GridCell {
  switch (spec.kind) {
    case 'badge': {
      const label = spec.label ? spec.label(value, row) : value == null ? '' : String(value);
      const tone = typeof spec.tone === 'function' ? spec.tone(value, row) : spec.tone;
      const color = toneColor(tone);
      return tagsCell(label ? [label] : [], () => color, themeOverride);
    }
    case 'tags': {
      const values = spec.values(row);
      return tagsCell(
        values,
        (t) => toneColor(typeof spec.tone === 'function' ? spec.tone(t, row) : spec.tone),
        themeOverride,
      );
    }
    case 'code': {
      const str = value == null ? '' : String(value);
      return {
        kind: GridCellKind.Text,
        data: str,
        displayData: str,
        allowOverlay: false,
        readonly: true,
        themeOverride: { fontFamily: MONO_FONT, bgCell: '#f3f4f6', ...themeOverride },
      };
    }
    case 'text': {
      const str = value == null ? '' : String(value);
      const color = spec.color?.(value, row);
      return {
        kind: GridCellKind.Text,
        data: str,
        displayData: str,
        allowOverlay: editable,
        readonly: !editable,
        themeOverride: color ? { textDark: color, ...themeOverride } : themeOverride,
      };
    }
    case 'toggle': {
      return {
        kind: GridCellKind.Boolean,
        data: Boolean(value),
        allowOverlay: false,
        readonly: !editable,
        themeOverride,
      };
    }
    case 'status': {
      const glyph = spec.icon(value, row);
      const tone = typeof spec.tone === 'function' ? spec.tone(value, row) : spec.tone;
      const label = spec.label?.(value, row);
      return {
        kind: GridCellKind.Custom,
        allowOverlay: false,
        copyData: label ?? glyph,
        themeOverride,
        data: { kind: 'status-cell', glyph, color: toneSolid(tone), label },
      } as unknown as GridCell;
    }
  }
}
