import { useState, useEffect, useCallback } from "react";

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  refetch: () => void;
}

export function useQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setErrorCode(null);

    fetcher()
      .then(setData)
      .catch((err: Error & { code?: string }) => {
        setError(err.message);
        setErrorCode(err.code ?? null);
        setData(null);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, errorCode, refetch };
}

export function useMutation<TArgs extends unknown[], TResult>(
  mutator: (...args: TArgs) => Promise<TResult>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [data, setData] = useState<TResult | null>(null);

  const mutate = useCallback(
    async (...args: TArgs) => {
      setLoading(true);
      setError(null);
      setErrorCode(null);
      try {
        const result = await mutator(...args);
        setData(result);
        return result;
      } catch (err) {
        const e = err as Error & { code?: string };
        setError(e.message);
        setErrorCode(e.code ?? null);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutator]
  );

  return { mutate, loading, error, errorCode, data };
}
