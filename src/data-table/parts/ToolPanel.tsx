// 컬럼 토글/순서 툴패널 — 상단 칩 목록. 드래그로 재배치, 체크로 가시성 토글.

import { Check, GripVertical } from 'lucide-react';
import type { ColumnState, NormalizedColumn } from '../types';

export type ToolPanelProps<T> = {
  columnState: ColumnState[];
  defById: Map<string, NormalizedColumn<T>>;
  draggedPanelId: string | null;
  dragOverPanelId: string | null;
  setDraggedPanelId: (v: string | null) => void;
  setDragOverPanelId: (v: string | null) => void;
  onPanelDrop: (targetId: string) => void;
  toggleColumn: (id: string) => void;
};

export function ToolPanel<T>({
  columnState,
  defById,
  draggedPanelId,
  dragOverPanelId,
  setDraggedPanelId,
  setDragOverPanelId,
  onPanelDrop,
  toggleColumn,
}: ToolPanelProps<T>) {
  return (
    <div className="border-b border-border bg-muted-shadcn/30 max-h-[220px] overflow-auto">
      <div className="flex flex-wrap gap-1.5 px-3 py-2">
        {columnState.map((s) => {
          const def = defById.get(s.id);
          if (!def) return null;
          return (
            <div
              key={s.id}
              draggable
              onDragStart={() => setDraggedPanelId(s.id)}
              onDragOver={(e) => {
                e.preventDefault();
                if (s.id !== draggedPanelId) setDragOverPanelId(s.id);
              }}
              onDrop={() => onPanelDrop(s.id)}
              onDragEnd={() => {
                setDraggedPanelId(null);
                setDragOverPanelId(null);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs cursor-grab active:cursor-grabbing ${
                draggedPanelId === s.id
                  ? 'opacity-40 border-border'
                  : dragOverPanelId === s.id
                    ? 'border-primary bg-accent-shadcn'
                    : s.visible
                      ? 'border-border bg-background hover:bg-accent-shadcn/60'
                      : 'border-dashed border-border bg-muted-shadcn/50 text-muted-shadcn-foreground'
              }`}
            >
              <GripVertical size={11} className="text-muted-shadcn-foreground shrink-0" />
              <button
                type="button"
                onClick={() => def.hideable !== false && toggleColumn(s.id)}
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                  s.visible ? 'bg-primary border-primary' : 'border-border'
                } ${def.hideable === false ? 'opacity-40 cursor-not-allowed' : ''}`}
                disabled={def.hideable === false}
                aria-label={s.visible ? 'hide' : 'show'}
              >
                {s.visible && <Check size={9} className="text-primary-foreground" strokeWidth={3} />}
              </button>
              <span
                className={`truncate ${s.visible ? 'text-foreground' : 'text-muted-shadcn-foreground'}`}
              >
                {def.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
