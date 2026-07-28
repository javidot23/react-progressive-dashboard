import { useWindowVirtualizer } from "@tanstack/react-virtual";
import {
  type Key,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const autoLoadVisibilityDelay = 200;

export type VirtualizedInfiniteCollectionProps<T> = {
  autoLoadMore?: boolean;
  emptyState: ReactNode;
  estimateSize: (index: number) => number;
  getItemKey: (item: T) => Key;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  items: readonly T[];
  onLoadMore: () => Promise<unknown>;
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
};

export function VirtualizedInfiniteCollection<T>({
  autoLoadMore = true,
  emptyState,
  estimateSize,
  getItemKey,
  hasNextPage,
  isFetchingNextPage,
  items,
  onLoadMore,
  overscan = 6,
  renderItem,
}: VirtualizedInfiniteCollectionProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const [loaderNode, setLoaderNode] = useState<HTMLDivElement | null>(
    null,
  );

  useLayoutEffect(() => {
    let animationFrame = 0;
    const updateScrollMargin = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const list = listRef.current;
        if (list) {
          setScrollMargin(list.getBoundingClientRect().top + window.scrollY);
        }
      });
    };

    updateScrollMargin();
    const resizeObserver = new ResizeObserver(updateScrollMargin);
    resizeObserver.observe(document.body);
    window.addEventListener("resize", updateScrollMargin);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollMargin);
    };
  }, []);

  const loaderIndex = items.length;
  const virtualizer = useWindowVirtualizer<HTMLDivElement>({
    count: items.length + (hasNextPage ? 1 : 0),
    estimateSize: (index) => (index === loaderIndex ? 72 : estimateSize(index)),
    getItemKey: (index) =>
      index === loaderIndex ? "__loader__" : getItemKey(items[index]!),
    overscan,
    scrollMargin,
  });
  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    if (
      !autoLoadMore ||
      !loaderNode ||
      !hasNextPage ||
      isFetchingNextPage
    ) {
      return;
    }

    let loadRequested = false;
    let loadTimer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          window.clearTimeout(loadTimer);
          loadTimer = undefined;
          return;
        }

        if (loadRequested || loadTimer !== undefined) return;

        loadTimer = window.setTimeout(() => {
          loadRequested = true;
          loadTimer = undefined;
          void onLoadMore();
        }, autoLoadVisibilityDelay);
      },
      {
        root: null,
        threshold: 0,
      },
    );

    observer.observe(loaderNode);
    return () => {
      window.clearTimeout(loadTimer);
      observer.disconnect();
    };
  }, [
    autoLoadMore,
    hasNextPage,
    isFetchingNextPage,
    loaderNode,
    onLoadMore,
  ]);

  if (items.length === 0 && !hasNextPage) {
    return <>{emptyState}</>;
  }

  return (
    <div ref={listRef}>
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualItems.map((virtualItem) => {
          const isLoader = virtualItem.index === loaderIndex;

          return (
            <div
              key={virtualItem.key}
              ref={virtualizer.measureElement}
              data-index={virtualItem.index}
              className="absolute left-0 top-0 w-full pb-3"
              style={{
                transform: `translateY(${
                  virtualItem.start - virtualizer.options.scrollMargin
                }px)`,
              }}
            >
              {isLoader ? (
                <div
                  ref={setLoaderNode}
                  className="flex min-h-[4rem] items-center justify-center"
                >
                  <button
                    type="button"
                    disabled={isFetchingNextPage}
                    onClick={() => void onLoadMore()}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-60"
                  >
                    {isFetchingNextPage ? "Loading more..." : "Load more"}
                  </button>
                </div>
              ) : (
                renderItem(items[virtualItem.index]!, virtualItem.index)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
