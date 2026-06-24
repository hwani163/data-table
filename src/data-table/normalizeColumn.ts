// 컬럼 정규화 — shadcn/TanStack alias + native 필드를 단일 NormalizedColumn 으로.
// Native 가 alias 보다 우선. id/accessorKey 둘 다 없으면 에러.

import type { DataTableColumn, NormalizedColumn } from './types';

export function normalizeColumn<T>(c: DataTableColumn<T>): NormalizedColumn<T> {
  const id = c.id ?? c.accessorKey;
  if (!id) throw new Error('DataTableColumn requires `id` or `accessorKey`');
  const accessor: (r: T) => unknown =
    c.accessor ??
    c.accessorFn ??
    (c.index !== undefined
      ? (
          (i) => (r: T) =>
            (r as unknown[])[i]
        )(c.index)
      : c.accessorKey
        ? (
            (k) => (r: T) =>
              (r as Record<string, unknown>)[k]
          )(c.accessorKey)
        : (
            (k) => (r: T) =>
              (r as Record<string, unknown>)[k]
          )(id));
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
  };
}
