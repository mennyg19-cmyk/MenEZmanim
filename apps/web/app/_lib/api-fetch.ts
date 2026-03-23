/**
 * Shared JSON fetch for client-side Next.js pages.
 * Throws with the API `error` message when `!res.ok`.
 */
export async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}
