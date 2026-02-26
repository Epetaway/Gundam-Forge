const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const normalizedBasePath = rawBasePath.length > 0 && !rawBasePath.startsWith('/') ? `/${rawBasePath}` : rawBasePath;

export function withBasePath(path: string): string {
  if (!normalizedBasePath) return path;
  if (!path.startsWith('/')) return path;
  if (path.startsWith(normalizedBasePath)) return path;
  return `${normalizedBasePath}${path}`;
}

export function getBasePath(): string {
  return normalizedBasePath || '';
}
