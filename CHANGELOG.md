# Changelog

## 0.2.0

JSX 없이 canvas 위에서 풍부한 셀을 표현하기 위한 선언적 API 추가. 마이그레이션
리포트의 라이브러리 개선 요구사항 중 #1·#2·#5·#6 + 가벼운 #3 을 구현.

### Added

- **선언적 표시 셀** (`column.display`) — JSX 셀 렌더러 없이 canvas 친화적으로 렌더:
  - `{ kind: 'badge', tone, label }` — 단일 색상 배지 (상태 pill)
  - `{ kind: 'tags', values, tone }` — 다중 태그 칩 (자동 줄바꿈)
  - `{ kind: 'code' }` — monospace 코드 칩
  - `{ kind: 'text', color }` — 색상 텍스트
  - `{ kind: 'toggle' }` — 불리언 토글(체크박스, `editable`+`onCellEdited`)
  - 내부적으로 glide 공식 `TagsCell` · `BooleanCell` · Text+`themeOverride` 로 환원.
- **액션 컬럼** (`column.actions: (row) => RowAction[]`) — 행마다 클릭 가능한 버튼 묶음.
  `{ label, onClick, tone?, disabled? }`. 신규 canvas custom cell + posX 히트테스트.
  액션 컬럼은 기본적으로 `disableRowClick: true`.
- **행 클릭** (`onRowClick(row)`) — 셀/컬럼 무관 행 클릭 콜백.
  `column.disableRowClick` 로 특정 컬럼(액션/토글) 제외.
- **셀별 테마** (`column.cellTheme: (value, row) => Partial<Theme>`) — 배경/글자색/폰트
  per-cell override (glide `themeOverride` 노출).
- **상태/에르고노믹스 props** — `loading`(로딩 오버레이), `emptyMessage`(빈 상태),
  `footer`(상태바 위 슬롯, 페이저 등).
- 신규 export 타입: `DisplaySpec<T>`, `BadgeTone`, `RowAction`. 라벨에 `loading` 추가.

### Notes / 의도적으로 제외

- **확장/마스터-디테일 행** (리포트 #4): glide 는 플랫 가상화 그리드라 행 사이 임의
  React 패널 삽입은 도구를 거스름 → 라이브러리에 넣지 않음. 해당 테이블은 shadcn 유지 권장.
- **무거운 액션** (오버플로 메뉴 / AlertDialog 확인 / 스피너): v0.2 의 `actions` 는 단순
  버튼/토글까지만. 셀 안 lucide 아이콘은 canvas 라 텍스트 라벨로 대체.

### Unchanged

- 기존 0.1 API(`format`, select dropdown, sort, 컬럼 resize/reorder/hide, ToolPanel,
  StatusBar, HeaderMenu) 전부 호환. peer deps·설치 방식·dist 커밋 정책 동일.

## 0.1.0

- Initial release. `DataTable<T>` — AG-Grid Lite over `@glideapps/glide-data-grid`.
