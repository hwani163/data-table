import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // peer deps는 번들에 넣지 않고 외부 참조로 둔다.
  // 정규식 하나로 glide-data-grid · glide-data-grid-cells · /dist/index.css 까지 모두 external 처리.
  external: ['react', 'react-dom', 'lucide-react', /@glideapps\/glide-data-grid/],
});
