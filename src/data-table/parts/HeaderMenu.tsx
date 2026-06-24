// 헤더 드롭다운 메뉴 — 정렬(오름/내림/해제) + 컬럼 숨기기.
// 위치는 Glide `screenPosition`(viewport 좌표) → position:fixed 로 직접 매핑.

import type { ReactNode, RefObject } from 'react';
import type { Rectangle } from '@glideapps/glide-data-grid';
import { ArrowDown, ArrowUp, EyeOff, X } from 'lucide-react';
import type { DataTableLabels, SortDir } from '../types';

export type HeaderMenuState = { colId: string; bounds: Rectangle };

export type HeaderMenuProps = {
  menu: HeaderMenuState;
  enableSort: boolean;
  labels: DataTableLabels;
  menuRef: RefObject<HTMLDivElement | null>;
  onSort: (dir: SortDir | null) => void;
  onHide: () => void;
};

export function HeaderMenu({ menu, enableSort, labels, menuRef, onSort, onHide }: HeaderMenuProps) {
  return (
    <div
      ref={menuRef}
      style={{
        // Glide `screenPosition` 은 viewport(window) 좌표 → fixed 로 직접 매핑.
        // absolute + 컨테이너 상대 좌표는 grid 가 스크롤되거나 컨테이너가 작은 경우
        // 메뉴가 엉뚱한 위치(테이블 바닥) 에 뜸.
        position: 'fixed',
        top: menu.bounds.y + menu.bounds.height,
        left: menu.bounds.x,
        zIndex: 50,
      }}
      className="w-44 rounded-md border border-border bg-popover shadow-2xl py-1 text-xs"
    >
      {enableSort && (
        <>
          <MenuItem icon={<ArrowUp size={12} />} label={labels.sortAsc} onClick={() => onSort('asc')} />
          <MenuItem
            icon={<ArrowDown size={12} />}
            label={labels.sortDesc}
            onClick={() => onSort('desc')}
          />
          <MenuItem icon={<X size={12} />} label={labels.sortClear} onClick={() => onSort(null)} />
          <div className="h-px bg-border my-1" />
        </>
      )}
      <MenuItem icon={<EyeOff size={12} />} label={labels.hide} onClick={onHide} />
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-3 py-1.5 flex items-center gap-2 text-left hover:bg-accent-shadcn text-foreground"
    >
      <span className="text-slate-500">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
