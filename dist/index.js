import { useMemo, useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { GridCellKind, getMiddleCenterBias, DataEditor } from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import { DropdownCell, allCells } from '@glideapps/glide-data-grid-cells';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { GripVertical, Check, ArrowUp, ArrowDown, X, EyeOff } from 'lucide-react';

// src/data-table/index.tsx
var BADGE_BG = "#eef1f5";
var BADGE_FG = "#374151";
var renderer = {
  kind: GridCellKind.Custom,
  isMatch: (c) => c.data?.kind === "badge-dropdown-cell",
  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const text = cell.data.value ?? "";
    if (!text) return true;
    const padX = 8;
    const chipH = Math.min(rect.height - 6, 22);
    const m = ctx.measureText(text);
    const chipW = Math.min(m.width + padX * 2, rect.width - theme.cellHorizontalPadding * 2);
    const x = rect.x + theme.cellHorizontalPadding;
    const y = rect.y + (rect.height - chipH) / 2;
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
    ctx.fillStyle = BADGE_FG;
    ctx.fillText(
      text,
      x + padX,
      y + chipH / 2 + getMiddleCenterBias(ctx, theme)
    );
    return true;
  },
  measure: (ctx, cell, theme) => {
    const text = cell.data.value ?? "";
    return (text ? ctx.measureText(text).width : 0) + theme.cellHorizontalPadding * 2 + 24;
  },
  // Editor 는 Glide 공식 dropdown-cell 과 동일 — react-select overlay 재사용.
  // dropdown-cell 의 Editor 는 cell.data.value / allowedValues 만 읽으므로 duck-typing OK.
  // onFinishedEditing 도 spread 만 해서 우리 kind 'badge-dropdown-cell' 보존.
  provideEditor: DropdownCell.provideEditor,
  onPaste: (v, d) => ({
    ...d,
    value: d.allowedValues.includes(v) ? v : d.value
  })
};
var badge_dropdown_cell_default = renderer;
var TONE_BG = {
  default: "#eef1f5",
  secondary: "#e5e7eb",
  success: "#dcfce7",
  warning: "#fef9c3",
  destructive: "#fee2e2",
  info: "#dbeafe"
};
var TONE_FG = {
  default: "#374151",
  secondary: "#374151",
  success: "#166534",
  warning: "#854d0e",
  destructive: "#991b1b",
  info: "#1e40af"
};
var PAD = 6;
var GAP = 6;
var BTN_PAD = 8;
var CHAR_W = 6.6;
var BTN_H = 22;
var RADIUS = 4;
function layout(actions) {
  const out = [];
  let x = PAD;
  for (const a of actions) {
    const w = Math.ceil(a.label.length * CHAR_W) + BTN_PAD * 2;
    out.push({ start: x, w });
    x += w + GAP;
  }
  return out;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
var renderer2 = {
  kind: GridCellKind.Custom,
  isMatch: (c) => c.data?.kind === "actions-cell",
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
      ctx.fillStyle = TONE_BG[a.tone ?? "default"];
      roundRect(ctx, x, y, w, BTN_H, RADIUS);
      ctx.fill();
      ctx.fillStyle = TONE_FG[a.tone ?? "default"];
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
          const y = bounds.y + (bounds.height - BTN_H) / 2;
          requestConfirm(a, { x: bounds.x + start, y, w, h: BTN_H });
        } else {
          a.onClick();
        }
        break;
      }
    }
    return void 0;
  }
};
var actions_cell_default = renderer2;
var TRACK_W = 34;
var TRACK_H = 18;
var KNOB_R = 7;
var ON_COLOR = "#16a34a";
var OFF_COLOR = "#cbd5e1";
function roundRect2(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
var renderer3 = {
  kind: GridCellKind.Custom,
  isMatch: (c) => c.data?.kind === "toggle-cell",
  needsHover: true,
  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const { checked, disabled, busy } = cell.data;
    const x = rect.x + theme.cellHorizontalPadding;
    const y = rect.y + (rect.height - TRACK_H) / 2;
    ctx.save();
    ctx.globalAlpha = disabled ? 0.4 : busy ? 0.6 : 1;
    ctx.fillStyle = checked ? ON_COLOR : OFF_COLOR;
    roundRect2(ctx, x, y, TRACK_W, TRACK_H, TRACK_H / 2);
    ctx.fill();
    const cx = checked ? x + TRACK_W - TRACK_H / 2 : x + TRACK_H / 2;
    const cy = y + TRACK_H / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, KNOB_R, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    if (busy) {
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = checked ? ON_COLOR : "#64748b";
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
    return void 0;
  }
};
var toggle_cell_default = renderer3;
var S = 14;
function drawGlyph(ctx, glyph, cx, cy, color) {
  const h = S / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.75;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  switch (glyph) {
    case "check": {
      ctx.beginPath();
      ctx.moveTo(cx - h * 0.7, cy);
      ctx.lineTo(cx - h * 0.1, cy + h * 0.6);
      ctx.lineTo(cx + h * 0.8, cy - h * 0.7);
      ctx.stroke();
      break;
    }
    case "x": {
      ctx.beginPath();
      ctx.moveTo(cx - h * 0.6, cy - h * 0.6);
      ctx.lineTo(cx + h * 0.6, cy + h * 0.6);
      ctx.moveTo(cx + h * 0.6, cy - h * 0.6);
      ctx.lineTo(cx - h * 0.6, cy + h * 0.6);
      ctx.stroke();
      break;
    }
    case "clock": {
      ctx.beginPath();
      ctx.arc(cx, cy, h * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - h * 0.55);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + h * 0.45, cy + h * 0.1);
      ctx.stroke();
      break;
    }
    case "spinner": {
      ctx.beginPath();
      ctx.arc(cx, cy, h * 0.8, -Math.PI * 0.5, Math.PI * 0.9);
      ctx.stroke();
      break;
    }
    case "alert": {
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
    case "dot": {
      ctx.beginPath();
      ctx.arc(cx, cy, h * 0.55, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}
var renderer4 = {
  kind: GridCellKind.Custom,
  isMatch: (c) => c.data?.kind === "status-cell",
  draw: (args, cell) => {
    const { ctx, theme, rect } = args;
    const { glyph, color, label } = cell.data;
    const x = rect.x + theme.cellHorizontalPadding;
    const cy = rect.y + rect.height / 2;
    if (glyph !== "none") {
      drawGlyph(ctx, glyph, x + S / 2, cy, color);
    }
    if (label) {
      const font = `12px ${theme.fontFamily}`;
      ctx.font = font;
      ctx.fillStyle = theme.textDark;
      const textX = glyph === "none" ? x : x + S + 6;
      ctx.fillText(label, textX, cy + getMiddleCenterBias(ctx, font));
    }
    return true;
  },
  measure: (ctx, cell, theme) => {
    const { glyph, label } = cell.data;
    const glyphW = glyph === "none" ? 0 : S + 6;
    const labelW = label ? ctx.measureText(label).width : 0;
    return theme.cellHorizontalPadding * 2 + glyphW + labelW;
  }
};
var status_cell_default = renderer4;

// src/data-table/types.ts
var DEFAULT_LABELS = {
  hiddenColumns: "\uC228\uAE34 \uCEEC\uB7FC",
  dropToHide: "\u2193 \uC5EC\uAE30\uC5D0 \uB4DC\uB86D\uD558\uC5EC \uC228\uAE30\uAE30",
  restore: "\uADF8\uB9AC\uB4DC\uB85C \uBCF5\uC6D0",
  sortAsc: "\uC624\uB984\uCC28\uC21C \uC815\uB82C",
  sortDesc: "\uB0B4\uB9BC\uCC28\uC21C \uC815\uB82C",
  sortClear: "\uC815\uB82C \uD574\uC81C",
  hide: "\uCEEC\uB7FC \uC228\uAE30\uAE30",
  rows: "rows",
  columns: "columns",
  sort: "\uC815\uB82C",
  loading: "\uBD88\uB7EC\uC624\uB294 \uC911\u2026",
  confirm: "\uD655\uC778",
  cancel: "\uCDE8\uC18C"
};

// src/data-table/normalizeColumn.ts
function normalizeColumn(c) {
  const id = c.id ?? c.accessorKey;
  if (!id) throw new Error("DataTableColumn requires `id` or `accessorKey`");
  const accessor = c.accessor ?? c.accessorFn ?? (c.index !== void 0 ? /* @__PURE__ */ ((i) => (r) => r[i])(c.index) : c.accessorKey ? /* @__PURE__ */ ((k) => (r) => r[k])(c.accessorKey) : /* @__PURE__ */ ((k) => (r) => r[k])(id));
  return {
    id,
    title: c.title ?? c.header ?? id,
    width: c.width ?? c.size,
    visible: c.visible,
    accessor,
    format: c.format,
    align: c.align,
    sortable: c.sortable ?? c.enableSorting ?? true,
    hideable: c.hideable ?? c.enableHiding ?? true,
    editable: c.editable ?? false,
    selectOptions: c.selectOptions,
    display: c.display,
    actions: c.actions,
    toggle: c.toggle,
    cellTheme: c.cellTheme,
    // 액션·토글 컬럼은 기본적으로 row-click 에서 제외 (버튼/스위치 클릭이 곧 행 클릭이 되면 안 됨).
    disableRowClick: c.disableRowClick ?? Boolean(c.actions || c.toggle)
  };
}
var TONE_BG2 = {
  default: "#eef1f5",
  secondary: "#e5e7eb",
  success: "#dcfce7",
  warning: "#fef9c3",
  destructive: "#fee2e2",
  info: "#dbeafe"
};
function toneColor(tone) {
  return TONE_BG2[tone ?? "default"];
}
var TONE_SOLID = {
  default: "#374151",
  secondary: "#6b7280",
  success: "#16a34a",
  warning: "#d97706",
  destructive: "#dc2626",
  info: "#2563eb"
};
function toneSolid(tone) {
  return TONE_SOLID[tone ?? "default"];
}
var MONO_FONT = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
function tagsCell(tags, colorFor, themeOverride) {
  return {
    kind: GridCellKind.Custom,
    allowOverlay: false,
    copyData: tags.join(", "),
    themeOverride,
    data: {
      kind: "tags-cell",
      tags,
      possibleTags: tags.map((t) => ({ tag: t, color: colorFor(t) }))
    }
  };
}
function buildDisplayCell(spec, value, row, editable, themeOverride) {
  switch (spec.kind) {
    case "badge": {
      const label = spec.label ? spec.label(value, row) : value == null ? "" : String(value);
      const tone = typeof spec.tone === "function" ? spec.tone(value, row) : spec.tone;
      const color = toneColor(tone);
      return tagsCell(label ? [label] : [], () => color, themeOverride);
    }
    case "tags": {
      const values = spec.values(row);
      return tagsCell(
        values,
        (t) => toneColor(typeof spec.tone === "function" ? spec.tone(t, row) : spec.tone),
        themeOverride
      );
    }
    case "code": {
      const str = value == null ? "" : String(value);
      return {
        kind: GridCellKind.Text,
        data: str,
        displayData: str,
        allowOverlay: false,
        readonly: true,
        themeOverride: { fontFamily: MONO_FONT, bgCell: "#f3f4f6", ...themeOverride }
      };
    }
    case "text": {
      const str = value == null ? "" : String(value);
      const color = spec.color?.(value, row);
      return {
        kind: GridCellKind.Text,
        data: str,
        displayData: str,
        allowOverlay: editable,
        readonly: !editable,
        themeOverride: color ? { textDark: color, ...themeOverride } : themeOverride
      };
    }
    case "toggle": {
      return {
        kind: GridCellKind.Boolean,
        data: Boolean(value),
        allowOverlay: false,
        readonly: !editable,
        themeOverride
      };
    }
    case "status": {
      const glyph = spec.icon(value, row);
      const tone = typeof spec.tone === "function" ? spec.tone(value, row) : spec.tone;
      const label = spec.label?.(value, row);
      return {
        kind: GridCellKind.Custom,
        allowOverlay: false,
        copyData: label ?? glyph,
        themeOverride,
        data: { kind: "status-cell", glyph, color: toneSolid(tone), label }
      };
    }
  }
}
var CARD = {
  position: "fixed",
  zIndex: 9999,
  minWidth: 200,
  maxWidth: 320,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
  padding: 12,
  fontSize: 13,
  color: "#111827"
};
var BTN = {
  fontSize: 12,
  lineHeight: "20px",
  padding: "4px 12px",
  borderRadius: 6,
  border: "1px solid #e5e7eb",
  cursor: "pointer",
  background: "#fff",
  color: "#374151"
};
function ConfirmPopover({
  x,
  y,
  title,
  description,
  confirmLabel,
  cancelLabel,
  toneColor: toneColor2,
  onConfirm,
  onCancel
}) {
  const ref = useRef(null);
  const confirmBtnRef = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    let left = x;
    let top = y;
    if (left + r.width > window.innerWidth - margin) left = window.innerWidth - r.width - margin;
    if (top + r.height > window.innerHeight - margin) top = y - r.height - 24;
    setPos({ left: Math.max(margin, left), top: Math.max(margin, top) });
  }, [x, y]);
  useEffect(() => {
    confirmBtnRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onCancel();
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousedown", onDown, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("mousedown", onDown, true);
    };
  }, [onCancel]);
  return /* @__PURE__ */ jsxs("div", { ref, style: { ...CARD, ...pos }, role: "dialog", "aria-modal": "true", children: [
    title && /* @__PURE__ */ jsx("div", { style: { fontWeight: 600, marginBottom: description ? 4 : 10 }, children: title }),
    description && /* @__PURE__ */ jsx("div", { style: { color: "#4b5563", marginBottom: 10 }, children: description }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, justifyContent: "flex-end" }, children: [
      /* @__PURE__ */ jsx("button", { type: "button", style: BTN, onClick: onCancel, children: cancelLabel }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          ref: confirmBtnRef,
          style: { ...BTN, background: toneColor2, borderColor: toneColor2, color: "#fff" },
          onClick: onConfirm,
          children: confirmLabel
        }
      )
    ] })
  ] });
}
function useColumnSizing(opts) {
  const { columnWidths, defaultColumnWidths, onColumnWidthsChange } = opts;
  const isControlled = columnWidths !== void 0;
  const [internal, setInternal] = useState(
    () => ({ ...defaultColumnWidths ?? {} })
  );
  const widths = isControlled ? columnWidths : internal;
  const applyResize = useCallback(
    (id, width, commit) => {
      if (isControlled) {
        onColumnWidthsChange?.({ ...columnWidths, [id]: width });
        return;
      }
      setInternal((prev) => {
        const next = { ...prev, [id]: width };
        if (commit) onColumnWidthsChange?.(next);
        return next;
      });
    },
    [isControlled, columnWidths, onColumnWidthsChange]
  );
  return { widths, applyResize };
}
function ToolPanel({
  columnState,
  defById,
  draggedPanelId,
  dragOverPanelId,
  setDraggedPanelId,
  setDragOverPanelId,
  onPanelDrop,
  toggleColumn
}) {
  return /* @__PURE__ */ jsx("div", { className: "border-b border-border bg-muted-shadcn/30 max-h-[220px] overflow-auto", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 px-3 py-2", children: columnState.map((s) => {
    const def = defById.get(s.id);
    if (!def) return null;
    return /* @__PURE__ */ jsxs(
      "div",
      {
        draggable: true,
        onDragStart: () => setDraggedPanelId(s.id),
        onDragOver: (e) => {
          e.preventDefault();
          if (s.id !== draggedPanelId) setDragOverPanelId(s.id);
        },
        onDrop: () => onPanelDrop(s.id),
        onDragEnd: () => {
          setDraggedPanelId(null);
          setDragOverPanelId(null);
        },
        className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs cursor-grab active:cursor-grabbing ${draggedPanelId === s.id ? "opacity-40 border-border" : dragOverPanelId === s.id ? "border-primary bg-accent-shadcn" : s.visible ? "border-border bg-background hover:bg-accent-shadcn/60" : "border-dashed border-border bg-muted-shadcn/50 text-muted-shadcn-foreground"}`,
        children: [
          /* @__PURE__ */ jsx(GripVertical, { size: 11, className: "text-muted-shadcn-foreground shrink-0" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => def.hideable !== false && toggleColumn(s.id),
              className: `w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${s.visible ? "bg-primary border-primary" : "border-border"} ${def.hideable === false ? "opacity-40 cursor-not-allowed" : ""}`,
              disabled: def.hideable === false,
              "aria-label": s.visible ? "hide" : "show",
              children: s.visible && /* @__PURE__ */ jsx(Check, { size: 9, className: "text-primary-foreground", strokeWidth: 3 })
            }
          ),
          /* @__PURE__ */ jsx(
            "span",
            {
              className: `truncate ${s.visible ? "text-foreground" : "text-muted-shadcn-foreground"}`,
              children: def.title
            }
          )
        ]
      },
      s.id
    );
  }) }) });
}
function HeaderMenu({ menu, enableSort, labels, menuRef, onSort, onHide }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: menuRef,
      style: {
        // Glide `screenPosition` 은 viewport(window) 좌표 → fixed 로 직접 매핑.
        // absolute + 컨테이너 상대 좌표는 grid 가 스크롤되거나 컨테이너가 작은 경우
        // 메뉴가 엉뚱한 위치(테이블 바닥) 에 뜸.
        position: "fixed",
        top: menu.bounds.y + menu.bounds.height,
        left: menu.bounds.x,
        zIndex: 50
      },
      className: "w-44 rounded-md border border-border bg-popover shadow-2xl py-1 text-xs",
      children: [
        enableSort && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(MenuItem, { icon: /* @__PURE__ */ jsx(ArrowUp, { size: 12 }), label: labels.sortAsc, onClick: () => onSort("asc") }),
          /* @__PURE__ */ jsx(
            MenuItem,
            {
              icon: /* @__PURE__ */ jsx(ArrowDown, { size: 12 }),
              label: labels.sortDesc,
              onClick: () => onSort("desc")
            }
          ),
          /* @__PURE__ */ jsx(MenuItem, { icon: /* @__PURE__ */ jsx(X, { size: 12 }), label: labels.sortClear, onClick: () => onSort(null) }),
          /* @__PURE__ */ jsx("div", { className: "h-px bg-border my-1" })
        ] }),
        /* @__PURE__ */ jsx(MenuItem, { icon: /* @__PURE__ */ jsx(EyeOff, { size: 12 }), label: labels.hide, onClick: onHide })
      ]
    }
  );
}
function MenuItem({
  icon,
  label,
  onClick
}) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick,
      className: "w-full px-3 py-1.5 flex items-center gap-2 text-left hover:bg-accent-shadcn text-foreground",
      children: [
        /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: icon }),
        /* @__PURE__ */ jsx("span", { children: label })
      ]
    }
  );
}
function StatusBar({ rowCount, visibleCount, totalCount, sort, titleFor, labels }) {
  return /* @__PURE__ */ jsxs("div", { className: "px-4 py-2 border-t border-border bg-muted-shadcn/40 text-[11px] text-muted-shadcn-foreground flex items-center justify-between", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      rowCount,
      " ",
      labels.rows,
      " \xB7 ",
      visibleCount,
      " / ",
      totalCount,
      " ",
      labels.columns
    ] }),
    sort && /* @__PURE__ */ jsxs("div", { children: [
      labels.sort,
      ":",
      " ",
      /* @__PURE__ */ jsxs("span", { className: "text-foreground", children: [
        titleFor(sort.id),
        " ",
        sort.dir === "asc" ? "\u2191" : "\u2193"
      ] })
    ] })
  ] });
}
var CUSTOM_RENDERERS = [
  badge_dropdown_cell_default,
  actions_cell_default,
  toggle_cell_default,
  status_cell_default,
  ...allCells
];
var EMPTY_TEXT = {
  kind: GridCellKind.Text,
  data: "",
  displayData: "",
  allowOverlay: false
};
function DataTable({
  data,
  columns: rawColumns,
  columnState: controlledState,
  onColumnStateChange,
  columnWidths,
  defaultColumnWidths,
  onColumnWidthsChange,
  sort: controlledSort,
  onSortChange,
  sortedData: externalSortedData,
  enableToolPanel = true,
  enableStatusBar = true,
  enableSort = true,
  enableHeaderMenu = true,
  onCellEdited,
  onCellContextMenu,
  onCellActivated,
  onRowClick,
  loading = false,
  emptyMessage,
  footer,
  defaultColumnWidth = 140,
  rowMarkers,
  gridSelection,
  onGridSelectionChange,
  className = "",
  height = "100%",
  width = "100%",
  theme,
  labels: labelOverrides
}) {
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...labelOverrides }), [labelOverrides]);
  const containerRef = useRef(null);
  const [confirmState, setConfirmState] = useState(null);
  const requestConfirm = useCallback((action, anchor) => {
    const r = containerRef.current?.getBoundingClientRect();
    setConfirmState({
      action,
      x: (r?.left ?? 0) + anchor.x,
      y: (r?.top ?? 0) + anchor.y + anchor.h + 4
    });
  }, []);
  const closeConfirm = useCallback(() => setConfirmState((c) => c ? null : c), []);
  const onVisibleRegionChanged = useCallback(() => closeConfirm(), [closeConfirm]);
  useEffect(() => {
    if (!confirmState) return;
    window.addEventListener("resize", closeConfirm);
    return () => window.removeEventListener("resize", closeConfirm);
  }, [confirmState, closeConfirm]);
  const columns = useMemo(() => rawColumns.map(normalizeColumn), [rawColumns]);
  const defById = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const c of columns) m.set(c.id, c);
    return m;
  }, [columns]);
  const [internalState, setInternalState] = useState(
    () => columns.map((c) => ({
      id: c.id,
      width: c.width ?? defaultColumnWidth,
      visible: c.visible ?? true
    }))
  );
  const columnState = controlledState ?? internalState;
  const setColumnState = useCallback(
    (updater) => {
      if (controlledState) {
        onColumnStateChange?.(updater(controlledState));
      } else {
        setInternalState((prev) => {
          const next = updater(prev);
          onColumnStateChange?.(next);
          return next;
        });
      }
    },
    [controlledState, onColumnStateChange]
  );
  const visibleState = useMemo(
    () => columnState.filter((s) => s.visible && defById.has(s.id)),
    [columnState, defById]
  );
  const { widths, applyResize } = useColumnSizing({
    columnWidths,
    defaultColumnWidths,
    onColumnWidthsChange
  });
  const [internalSort, setInternalSort] = useState(null);
  const sort = controlledSort ?? internalSort;
  const setSort = useCallback(
    (next) => {
      if (controlledSort !== void 0) onSortChange?.(next);
      else {
        setInternalSort(next);
        onSortChange?.(next);
      }
    },
    [controlledSort, onSortChange]
  );
  const sortedData = useMemo(() => {
    if (externalSortedData) return externalSortedData;
    if (!sort || !enableSort) return data;
    const def = defById.get(sort.id);
    if (!def) return data;
    const accessor = def.accessor;
    const dir = sort.dir;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (typeof av === "number" && typeof bv === "number") {
        return dir === "asc" ? av - bv : bv - av;
      }
      return dir === "asc" ? String(av ?? "").localeCompare(String(bv ?? "")) : String(bv ?? "").localeCompare(String(av ?? ""));
    });
    return copy;
  }, [externalSortedData, sort, enableSort, defById, data]);
  const visibleResolved = useMemo(
    () => visibleState.map((s) => defById.get(s.id)).filter((c) => Boolean(c)),
    [visibleState, defById]
  );
  const gridColumns = useMemo(
    () => visibleState.map((s) => {
      const def = defById.get(s.id);
      return {
        id: s.id,
        title: def.title,
        width: widths[s.id] ?? def.width ?? defaultColumnWidth,
        hasMenu: enableHeaderMenu
      };
    }),
    [visibleState, defById, widths, defaultColumnWidth, enableHeaderMenu]
  );
  const selectOptionsByCol = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const c of columns) {
      if (c.selectOptions == null) continue;
      const opts = typeof c.selectOptions === "function" ? c.selectOptions(sortedData) : c.selectOptions;
      m.set(c.id, opts);
    }
    return m;
  }, [columns, sortedData]);
  const getCellContent = useCallback(
    ([col, row]) => {
      const def = visibleResolved[col];
      if (!def) return EMPTY_TEXT;
      const rec = sortedData[row];
      if (rec == null) return EMPTY_TEXT;
      const value = def.accessor(rec);
      const editable = def.editable;
      const themeOverride = def.cellTheme ? def.cellTheme(value, rec) : void 0;
      if (def.actions) {
        return {
          kind: GridCellKind.Custom,
          allowOverlay: false,
          copyData: "",
          themeOverride,
          data: { kind: "actions-cell", actions: def.actions(rec), requestConfirm }
        };
      }
      if (def.toggle) {
        const t = def.toggle;
        const checked = t.checked(rec);
        return {
          kind: GridCellKind.Custom,
          allowOverlay: false,
          copyData: checked ? "on" : "off",
          themeOverride,
          data: {
            kind: "toggle-cell",
            checked,
            disabled: t.disabled?.(rec) ?? false,
            busy: t.busy?.(rec) ?? false,
            onToggle: () => t.onChange(rec, !checked)
          }
        };
      }
      if (def.display) {
        return buildDisplayCell(def.display, value, rec, editable, themeOverride);
      }
      const opts = selectOptionsByCol.get(def.id);
      if (opts && editable) {
        const str2 = value == null ? "" : String(value);
        return {
          kind: GridCellKind.Custom,
          allowOverlay: true,
          copyData: str2,
          themeOverride,
          data: { kind: "badge-dropdown-cell", value: str2, allowedValues: opts }
        };
      }
      if (def.format) {
        const partial = def.format(value, rec);
        if (partial.kind) return partial;
        const str2 = value == null ? "" : String(value);
        return {
          kind: GridCellKind.Text,
          data: str2,
          displayData: str2,
          allowOverlay: editable,
          readonly: !editable,
          themeOverride,
          ...partial
        };
      }
      if (typeof value === "number") {
        return {
          kind: GridCellKind.Number,
          data: value,
          displayData: String(value),
          allowOverlay: editable,
          readonly: !editable,
          contentAlign: def.align ?? "right",
          themeOverride
        };
      }
      const str = value == null ? "" : String(value);
      return {
        kind: GridCellKind.Text,
        data: str,
        displayData: str,
        allowOverlay: editable,
        readonly: !editable,
        contentAlign: def.align,
        themeOverride
      };
    },
    [visibleResolved, sortedData, selectOptionsByCol, requestConfirm]
  );
  const handleCellEdited = useCallback(
    (cell, newValue) => {
      if (!onCellEdited) return;
      const [c, r] = cell;
      const def = visibleResolved[c];
      const rec = sortedData[r];
      if (!def || rec == null) return;
      onCellEdited({ row: rec, columnId: def.id, newValue });
    },
    [onCellEdited, visibleResolved, sortedData]
  );
  const handleCellActivated = useCallback(
    (cell) => {
      if (!onCellActivated) return;
      const [c, r] = cell;
      const def = visibleResolved[c];
      const rec = sortedData[r];
      if (!def || rec == null) return;
      onCellActivated({ row: rec, columnId: def.id });
    },
    [onCellActivated, visibleResolved, sortedData]
  );
  const handleCellClicked = useCallback(
    (cell) => {
      if (!onRowClick) return;
      const [c, r] = cell;
      const def = visibleResolved[c];
      const rec = sortedData[r];
      if (!def || rec == null) return;
      if (def.disableRowClick) return;
      onRowClick(rec);
    },
    [onRowClick, visibleResolved, sortedData]
  );
  const handleCellContextMenu = useCallback(
    (cell, event) => {
      if (!onCellContextMenu) return;
      const [c, r] = cell;
      const def = visibleResolved[c];
      const rec = sortedData[r];
      if (!def || rec == null) return;
      onCellContextMenu({ row: rec, columnId: def.id, event });
    },
    [onCellContextMenu, visibleResolved, sortedData]
  );
  const onColumnResize = useCallback(
    (column, newSize) => {
      if (column.id) applyResize(column.id, newSize, false);
    },
    [applyResize]
  );
  const onColumnResizeEnd = useCallback(
    (column, newSize) => {
      if (column.id) applyResize(column.id, newSize, true);
    },
    [applyResize]
  );
  const onColumnMoved = useCallback(
    (startIndex, endIndex) => {
      setColumnState((prev) => {
        const vis = prev.filter((s) => s.visible);
        const hid = prev.filter((s) => !s.visible);
        const next = [...vis];
        const [moved] = next.splice(startIndex, 1);
        next.splice(endIndex, 0, moved);
        return [...next, ...hid];
      });
    },
    [setColumnState]
  );
  const onHeaderClicked = useCallback(
    (colIndex) => {
      if (!enableSort) return;
      const def = visibleResolved[colIndex];
      if (!def || !def.sortable) return;
      const colId = def.id;
      const next = sort?.id !== colId ? { id: colId, dir: "asc" } : sort.dir === "asc" ? { id: colId, dir: "desc" } : null;
      setSort(next);
    },
    [enableSort, visibleResolved, sort, setSort]
  );
  const [headerMenu, setHeaderMenu] = useState(null);
  const onHeaderMenuClick = useCallback(
    (colIndex, bounds) => {
      const def = visibleResolved[colIndex];
      if (def) setHeaderMenu({ colId: def.id, bounds });
    },
    [visibleResolved]
  );
  const hideColumn = useCallback(
    (id) => {
      setColumnState((prev) => prev.map((s) => s.id === id ? { ...s, visible: false } : s));
      setHeaderMenu(null);
    },
    [setColumnState]
  );
  const toggleColumn = useCallback(
    (id) => setColumnState((prev) => prev.map((s) => s.id === id ? { ...s, visible: !s.visible } : s)),
    [setColumnState]
  );
  const menuRef = useRef(null);
  useEffect(() => {
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setHeaderMenu(null);
      }
    };
    if (headerMenu) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [headerMenu]);
  const getCellsForSelection = useCallback(
    (selection) => {
      const result = [];
      for (let r = selection.y; r < selection.y + selection.height; r++) {
        const row = [];
        for (let c = selection.x; c < selection.x + selection.width; c++) {
          row.push(getCellContent([c, r]));
        }
        result.push(row);
      }
      return result;
    },
    [getCellContent]
  );
  const [draggedPanelId, setDraggedPanelId] = useState(null);
  const [dragOverPanelId, setDragOverPanelId] = useState(null);
  const onPanelDrop = useCallback(
    (targetId) => {
      if (!draggedPanelId || draggedPanelId === targetId) {
        setDraggedPanelId(null);
        setDragOverPanelId(null);
        return;
      }
      setColumnState((prev) => {
        const next = [...prev];
        const from = next.findIndex((s) => s.id === draggedPanelId);
        const to = next.findIndex((s) => s.id === targetId);
        if (from < 0 || to < 0) return prev;
        const [m] = next.splice(from, 1);
        next.splice(to, 0, m);
        return next;
      });
      setDraggedPanelId(null);
      setDragOverPanelId(null);
    },
    [draggedPanelId, setColumnState]
  );
  const titleFor = useCallback((id) => defById.get(id)?.title ?? id, [defById]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `w-full h-full bg-background text-foreground flex flex-col overflow-hidden ${className}`,
      children: [
        enableToolPanel && /* @__PURE__ */ jsx(
          ToolPanel,
          {
            columnState,
            defById,
            draggedPanelId,
            dragOverPanelId,
            setDraggedPanelId,
            setDragOverPanelId,
            onPanelDrop,
            toggleColumn
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-1 overflow-hidden relative", children: [
          /* @__PURE__ */ jsxs("div", { ref: containerRef, className: "flex-1 overflow-hidden relative", children: [
            /* @__PURE__ */ jsx(
              DataEditor,
              {
                columns: gridColumns,
                rows: sortedData.length,
                getCellContent,
                onColumnResize,
                onColumnResizeEnd,
                onColumnMoved,
                onHeaderClicked,
                onHeaderMenuClick: enableHeaderMenu ? onHeaderMenuClick : void 0,
                onCellEdited: onCellEdited ? handleCellEdited : void 0,
                onCellContextMenu: onCellContextMenu ? handleCellContextMenu : void 0,
                onCellActivated: onCellActivated ? handleCellActivated : void 0,
                onCellClicked: onRowClick ? handleCellClicked : void 0,
                getCellsForSelection,
                customRenderers: CUSTOM_RENDERERS,
                rangeSelect: "multi-rect",
                columnSelect: "multi",
                rowSelect: "multi",
                rowMarkers,
                gridSelection,
                onGridSelectionChange,
                onVisibleRegionChanged,
                smoothScrollX: true,
                smoothScrollY: true,
                width,
                height,
                theme
              }
            ),
            !loading && sortedData.length === 0 && emptyMessage != null && /* @__PURE__ */ jsx("div", { style: OVERLAY_STYLE, children: emptyMessage }),
            loading && /* @__PURE__ */ jsx("div", { style: { ...OVERLAY_STYLE, pointerEvents: "auto" }, children: /* @__PURE__ */ jsx("span", { style: { opacity: 0.6, fontSize: 13 }, children: labels.loading }) })
          ] }),
          headerMenu && enableHeaderMenu && /* @__PURE__ */ jsx(
            HeaderMenu,
            {
              menu: headerMenu,
              enableSort,
              labels,
              menuRef,
              onSort: (dir) => {
                setSort(dir === null ? null : { id: headerMenu.colId, dir });
                setHeaderMenu(null);
              },
              onHide: () => hideColumn(headerMenu.colId)
            }
          )
        ] }),
        footer != null && /* @__PURE__ */ jsx("div", { className: "dt-footer", children: footer }),
        enableStatusBar && /* @__PURE__ */ jsx(
          StatusBar,
          {
            rowCount: sortedData.length,
            visibleCount: visibleState.length,
            totalCount: columnState.length,
            sort,
            titleFor,
            labels
          }
        ),
        confirmState && createPortal(
          (() => {
            const c = confirmState.action.confirm;
            const cfg = typeof c === "string" ? { description: c } : c ?? {};
            return /* @__PURE__ */ jsx(
              ConfirmPopover,
              {
                x: confirmState.x,
                y: confirmState.y,
                title: cfg.title,
                description: cfg.description,
                confirmLabel: cfg.confirmLabel ?? labels.confirm,
                cancelLabel: cfg.cancelLabel ?? labels.cancel,
                toneColor: toneSolid(cfg.tone),
                onConfirm: () => {
                  confirmState.action.onClick();
                  setConfirmState(null);
                },
                onCancel: () => setConfirmState(null)
              }
            );
          })(),
          document.body
        )
      ]
    }
  );
}
var OVERLAY_STYLE = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.55)",
  pointerEvents: "none",
  zIndex: 2
};
var data_table_default = DataTable;

export { DEFAULT_LABELS, DataTable, data_table_default as default };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map