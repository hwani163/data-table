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

## v0.2 — 풍부한 셀 · 행 클릭 · 상태

canvas 그리드에서 JSX 셀 렌더러 없이 배지/태그/버튼 등을 표현하기 위한 선언적 API.
`column.cell: () => <JSX/>` 가 불가능한 자리를 `display` / `actions` 가 대체합니다.

```tsx
const columns: DataTableColumn<Row>[] = [
  // 상태 배지 (값/행 기반 톤)
  { accessorKey: 'status', header: '상태',
    display: { kind: 'badge', tone: (v) => v === 'fail' ? 'destructive' : 'success' } },

  // 다중 태그 칩
  { id: 'keywords', header: '키워드',
    display: { kind: 'tags', values: (r) => r.keywords } },

  // 코드 칩 / 색상 텍스트
  { accessorKey: 'path', header: '경로', display: { kind: 'code' } },
  { accessorKey: 'grade', header: '등급',
    display: { kind: 'text', color: (v) => v === 'A' ? '#16a34a' : '#dc2626' } },

  // 토글 (불리언) — 편집 가능
  { accessorKey: 'active', header: '활성', editable: true,
    display: { kind: 'toggle' } },

  // 셀별 테마(음수=빨강 등)
  { accessorKey: 'amount', header: '금액', align: 'right',
    cellTheme: (v) => ({ textDark: typeof v === 'number' && v < 0 ? '#dc2626' : undefined }) },

  // 액션 컬럼 — 행마다 버튼 (자동 disableRowClick)
  { id: 'actions', header: '',
    actions: (row) => [
      { label: '실행', tone: 'success', onClick: () => run(row) },
      { label: '삭제', tone: 'destructive', disabled: row.locked, onClick: () => del(row) },
    ] },
];

<DataTable
  data={rows}
  columns={columns}
  onRowClick={(row) => openDrawer(row)}   // 액션/토글 컬럼 클릭은 제외됨
  loading={isLoading}
  emptyMessage={<div>결과가 없습니다</div>}
  footer={<Pager page={page} onChange={setPage} />}
  onCellEdited={({ row, columnId, newValue }) => save(row, columnId, newValue)}
/>
```

### 우선순위 & canvas 제약

- 셀 종류 우선순위: `actions` → `display` → select(dropdown) → `format` → 기본(number/text).
- 톤(`BadgeTone`)은 의미색 매핑(`success`/`warning`/`destructive`/`info`/`secondary`/`default`).
- **아이콘**: 셀 안 lucide 아이콘은 canvas 라 직접 못 그림 → 액션은 짧은 텍스트 라벨, 토글은
  네이티브 체크박스. 아이콘이 꼭 필요한 셀은 이 라이브러리 대상이 아님.
- **미지원(의도적)**: 확장/마스터-디테일 행, 오버플로 메뉴·확인 다이얼로그 같은 무거운 액션.
  이런 테이블은 shadcn/TanStack 유지를 권장.

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
| `DisplaySpec<T>` | type | 선언적 표시 셀 스펙 (badge/tags/code/text/toggle) — v0.2 |
| `BadgeTone` | type | 배지/태그/액션 색상 톤 (`default`·`success`·`warning`·`destructive`·`info`·`secondary`) — v0.2 |
| `RowAction` | type | 액션 컬럼 버튼 (`{ label, onClick, tone?, disabled? }`) — v0.2 |
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
| `onRowClick` | 행 클릭 콜백 (v0.2). `disableRowClick` 컬럼은 제외 |
| `loading` / `emptyMessage` / `footer` | 로딩 오버레이 · 빈 상태 · 하단 슬롯 (v0.2) |
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
