import { useEffect, useState } from 'react';

const cache = new Map<string, unknown>();

export function useData<T>(url: string) {
  const resolvedUrl = url.startsWith('/') ? `${import.meta.env.BASE_URL.replace(/\/$/, '')}${url}` : url;
  const [data, setData] = useState<T | null>(() => (cache.has(resolvedUrl) ? (cache.get(resolvedUrl) as T) : null));
  const [loading, setLoading] = useState(!cache.has(resolvedUrl));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (cache.has(resolvedUrl)) {
      setData(cache.get(resolvedUrl) as T);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(resolvedUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.json() as Promise<T>;
      })
      .then((json) => {
        cache.set(resolvedUrl, json);
        if (!cancelled) setData(json);
      })
      .catch((fetchError) => {
        if (!cancelled) setError(fetchError instanceof Error ? fetchError : new Error(String(fetchError)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedUrl]);

  return { data, loading, error };
}
