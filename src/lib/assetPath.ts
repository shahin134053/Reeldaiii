/**
 * Resolves public asset URLs cleanly across root domains (localhost / Hostinger)
 * and GitHub Pages subpath deployments (e.g. /Reeldaiii/).
 */
export function resolveAssetUrl(path: string, baseOverride?: string): string {
  const cleanPath = path.replace(/^\/+/, '');
  const metaEnv = (import.meta as { env?: { BASE_URL?: string } }).env;
  const rawBase = baseOverride ?? metaEnv?.BASE_URL ?? '/';
  const normalizedBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  return `${normalizedBase}${cleanPath}`;
}
