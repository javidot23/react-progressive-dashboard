import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { VirtualizedInfiniteCollection } from "../../../components/VirtualizedInfiniteCollection";
import { inventoryEstimatedRowSize } from "../../../features/inventory/inventoryConfig";
import {
  defaultInventoryFilters,
  inventoryRiskQueryOptions,
} from "../../../features/inventory/inventoryQueryOptions";
import type {
  InventoryFilters,
  InventoryRiskItem,
} from "../../../features/inventory/inventoryRepository";
import { useManageScrollState } from "../ManageScrollContext";

function InventoryRiskCard({ item }: { item: InventoryRiskItem }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {item.sku}
          </p>
          <h3 className="mt-1 font-semibold text-slate-950">{item.name}</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
          {item.risk} risk
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-600">
        On hand: {item.onHand} units
      </p>
    </article>
  );
}

export default function InventorySection() {
  const { activeId, isProgrammaticScrolling } = useManageScrollState();
  const [filters, setFilters] = useState<InventoryFilters>(
    defaultInventoryFilters,
  );
  const query = useInfiniteQuery(inventoryRiskQueryOptions(filters));
  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  const { fetchNextPage } = query;

  const loadMore = useCallback(
    () => fetchNextPage({ cancelRefetch: false }),
    [fetchNextPage],
  );

  if (query.isPending) {
    return <p aria-live="polite">Loading inventory…</p>;
  }

  if (query.isError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-5"
      >
        <p>Inventory could not be loaded: {query.error.message}</p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="mt-3 rounded-md bg-red-700 px-4 py-2 text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="inventory-heading"
            className="text-3xl font-bold text-slate-950"
          >
            Inventory
          </h2>
          <p className="mt-2 text-slate-600">
            {query.data.pages[0]?.total ?? 0} matching products
          </p>
        </div>

        <div className="flex items-center gap-3">
          {query.isPlaceholderData && query.isFetching ? (
            <span
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-2 text-sm text-slate-600"
            >
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600"
              />
              Updating inventory…
            </span>
          ) : null}

          <label className="text-sm font-medium text-slate-700">
            Risk
            <select
              value={filters.risk}
              onChange={(event) =>
                setFilters({
                  risk: event.target.value as InventoryFilters["risk"],
                })
              }
              className="ml-2 rounded-md border border-slate-300 bg-white px-3 py-2"
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        </div>
      </div>

      <VirtualizedInfiniteCollection
        autoLoadMore={
          activeId === "inventory" && !isProgrammaticScrolling
        }
        items={items}
        getItemKey={(item) => item.id}
        estimateSize={() => inventoryEstimatedRowSize}
        renderItem={(item) => <InventoryRiskCard item={item} />}
        hasNextPage={query.hasNextPage && !query.isFetchNextPageError}
        isFetchingNextPage={query.isFetchingNextPage}
        onLoadMore={loadMore}
        emptyState={<p>No inventory items match this filter.</p>}
      />

      {query.isFetchNextPageError ? (
        <div role="alert" className="mt-4 text-sm text-red-700">
          The next page failed. Your loaded items are still available.
          <button
            type="button"
            onClick={() => void loadMore()}
            className="ml-2 underline"
          >
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}
