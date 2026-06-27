import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "lib/utils";

export function useAsyncResource(loader) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const nextData = await loader();
      setData(nextData);
      setError("");
      return nextData;
    } catch (loaderError) {
      setError(getErrorMessage(loaderError));
      return null;
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, setData, loading, error, refresh };
}
