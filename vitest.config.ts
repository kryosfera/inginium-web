import { getViteConfig } from 'astro/config';
import type { ViteUserConfig } from 'vitest/config';
// getViteConfig permite renderizar componentes .astro en los tests (Container API).
// El cast salva la diferencia de versiones de Vite entre los tipos de Astro y de Vitest.
const config: ViteUserConfig = { test: { include: ['tests/unit/**/*.test.ts'] } };
export default getViteConfig(config as Parameters<typeof getViteConfig>[0]);
