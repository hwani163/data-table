# @hwani163/data-table

**AG-Grid Lite** — [`@glideapps/glide-data-grid`](https://github.com/glideapps/glide-data-grid)(canvas 엔진) 위에 기능 레이어를 얹은 공통 React 그리드 컴포넌트.

정렬 · 컬럼 너비 조절 · 컬럼 숨김/표시 · ToolPanel · StatusBar · HeaderMenu · badge-dropdown(select) 셀을 한 컴포넌트로 제공합니다. 컬럼 정의는 **shadcn / TanStack Table `ColumnDef<T>` 와 호환**됩니다 (drop-in).

```tsx
<DataTable data={rows} columns={cols} enableToolPanel enableSort />
```

---

## 설치

git URL로 바로 설치합니다 (npm 레지스트리 미배포).

```bash
# npm
npm install github:hwani163/data-table

# pnpm
pnpm add github:hwani163/data-table

# yarn
yarn add hwani163/data-table

# 특정 태그/커밋 고정
npm install github:hwani163/data-table#v0.1.0
```

> `dist/` 가 레포에 커밋되어 있어 설치 후 별도 빌드 단계가 필요 없습니다.

### peerDependencies

호스트 앱에 아래가 설치되어 있어야 합니다 (대부분 이미 있음):

```bash
npm install react @glideapps/glide-data-grid @glideapps/glide-data-grid-cells lucide-react
```

| peer | 범위 |
|---|---|
| `react` | `>=18` |
| `@glideapps/glide-data-grid` | `^6.0.0` |
| `@glideapps/glide-data-grid-cells` | `^6.0.0` |
| `lucide-react` | `>=1.0.0` |

### CSS

내부에서 glide-data-grid의 기본 CSS(`@glideapps/glide-data-grid/dist/index.css`)를 side-effect import 합니다. 번들러(Vite/webpack 등)를 쓰는 환경이면 자동으로 적용됩니다. CSS import를 지원하지 않는 환경이라면 호스트에서 직접 한 번 import 하세요.

Glide는 캔버스 위에 portal을 띄우므로, 앱 어딘가에 portal 타깃이 있어야 overlay editor가 보입니다:

```html
<div id="portal" style="position: fixed; left: 0; top: 0; z-index: 9999;"></div>
```

---

## 사용 예

```tsx
import { DataTable, type DataTableColumn } from '@hwani163/data-table';

type Row = { id: string; name: string; qty: number; grade: string };

const rows: Row[] = [
  { id: 'a', name: '광고 A', qty: 12, grade: 'A' },
  { id: 'b', name: '광고 B', qty: 7, grade: 'B' },
];

const columns: DataTableColumn<Row>[] = [
  { accessorKey: 'name', header: '소재명', size: 200, enableSorting: true },
  { accessorKey: 'qty', header: '횟수', align: 'right', sortable: true },
  {
    accessorKey: 'grade',
    header: '등급',
    editable: true,
    selectOptions: ['A', 'B', 'C'], // badge-dropdown 셀
  },
];

export function Example() {
  return (
    <DataTable
      data={rows}
      columns={columns}
      enableToolPanel
      enableStatusBar
      enableSort
      enableHeaderMenu
      height={400}
      onCellEdited={({ row, columnId, newValue }) => {
        console.log('edited', row.id, columnId, newValue);
      }}
    />
  );
}
```

---

## 공개 API

| export | 종류 | 설명 |
|---|---|---|
| `DataTable` | component (named + default) | 메인 그리드 컴포넌트 `DataTable<T>` |
| `DataTableColumn<T>` | type | 컬럼 정의 (shadcn/TanStack 호환 + native 확장) |
| `DataTableProps<T>` | type | 컴포넌트 props |
| `ColumnState` | type | 컬럼 구조 상태 (가시성·순서) |
| `SortState` / `SortDir` | type | 정렬 상태 |
| `DataTableLabels` | type | UI 라벨 (i18n) |
| `DEFAULT_LABELS` | const | 기본 라벨(한국어). `labels` prop으로 override |
| `NormalizedColumn<T>` | type | 정규화된 컬럼(내부 공유용) |

### 컬럼 정의 (`DataTableColumn<T>`)

shadcn/TanStack alias가 native 필드로 정규화됩니다 (native 우선):

| alias (shadcn) | → native |
|---|---|
| `accessorKey` | `row[accessorKey]` 접근 |
| `accessorFn` | `accessor` getter |
| `header` | `title` |
| `size` | `width` |
| `enableSorting` | `sortable` |
| `enableHiding` | `hideable` |

native 전용: `id` · `format(value,row)→Partial<GridCell>` · `align` · `editable` · `selectOptions`.

> ⚠️ 렌더 모델 한계: glide는 canvas라 shadcn식 `cell: () => ReactNode` JSX 렌더러는 못 받습니다. 대신 `format(value, row)`가 `Partial<GridCell>`을 반환합니다.

### 주요 props

| prop | 설명 |
|---|---|
| `data` / `columns` | 데이터 · 컬럼 정의 (필수) |
| `columnState` / `onColumnStateChange` | controlled 컬럼 구조(가시성·순서) |
| `columnWidths` / `defaultColumnWidths` / `onColumnWidthsChange` | 컬럼 너비 — **구조와 분리된 독립 채널** |
| `sort` / `onSortChange` / `sortedData` | 정렬 (controlled 또는 caller-sorted) |
| `enableToolPanel` / `enableStatusBar` / `enableSort` / `enableHeaderMenu` | 기능 토글 |
| `onCellEdited` / `onCellActivated` / `onCellContextMenu` | 셀 상호작용 콜백 |
| `rowMarkers` | `'none'`(기본) / `'checkbox'` / `'number'` / `'both'` |
| `gridSelection` / `onGridSelectionChange` | controlled 선택 상태 |
| `height` / `width` / `className` / `theme` / `labels` | 레이아웃 · 테마 · 라벨 |

전체 필드는 `DataTableProps<T>` 타입의 JSDoc 참고.

---

## 개발

```bash
pnpm install
pnpm build       # tsup → dist (ESM + CJS + d.ts)
pnpm typecheck   # tsc --noEmit
```

`dist/` 는 git-URL 설치를 위해 커밋합니다. 소스 변경 후 반드시 `pnpm build` 하여 `dist/` 를 갱신한 뒤 커밋하세요.

## License

[MIT](./LICENSE) © 원석환 (Seokhwan Won)
