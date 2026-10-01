export const REDIRECTS = [] as const;
export const redireccionesDinamicas = (_c: string[], _d: string[]) => [] as [string, string][];
export function toRedirectsFile(r: ReadonlyArray<readonly [string, string]>) {
  return r.map(([a, b]) => `${a} ${b} 301`).join('\n') + '\n';
}
