import { useEffect, useRef, useState } from "react";

type UseInfiniteScrollOptions = {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
};

export function useInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  rootMargin = "400px",
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(false);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsNearBottom(entry.isIntersecting);
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  useEffect(() => {
    if (isNearBottom && hasMore && !loading) {
      onLoadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNearBottom, hasMore, loading]);

  return sentinelRef;
}