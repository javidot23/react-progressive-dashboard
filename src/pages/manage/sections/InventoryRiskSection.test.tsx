import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { ReactNode } from "react";
import type {
  InventoryRiskItem,
  PageResult,
} from "../../../features/inventory/inventoryRepository";
import { inventoryRepository } from "../../../features/inventory/inventoryRepository";
import { ManageScrollProvider } from "../ManageScrollContext";
import type { ManageSectionId } from "../manageSections";
import InventoryRiskSection from "./InventoryRiskSection";

jest.mock("../../../components/VirtualizedInfiniteCollection", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    VirtualizedInfiniteCollection: ({
      autoLoadMore,
      emptyState,
      hasNextPage,
      isFetchingNextPage,
      items,
      onLoadMore,
      renderItem,
    }: {
      autoLoadMore: boolean;
      emptyState: ReactNode;
      hasNextPage: boolean;
      isFetchingNextPage: boolean;
      items: readonly InventoryRiskItem[];
      onLoadMore: () => Promise<unknown>;
      renderItem: (item: InventoryRiskItem, index: number) => ReactNode;
    }) => {
      React.useEffect(() => {
        if (autoLoadMore && hasNextPage && !isFetchingNextPage) {
          void onLoadMore();
        }
      }, [
        autoLoadMore,
        hasNextPage,
        isFetchingNextPage,
        onLoadMore,
      ]);

      return (
        <div
          data-testid="inventory-collection"
          data-auto-load={autoLoadMore}
        >
          {items.length === 0 && !hasNextPage
            ? emptyState
            : items.map((item, index) => (
                <div key={item.id}>{renderItem(item, index)}</div>
              ))}
          {hasNextPage ? (
            <button
              type="button"
              disabled={isFetchingNextPage}
              onClick={() => void onLoadMore()}
            >
              {isFetchingNextPage ? "Loading more..." : "Load more"}
            </button>
          ) : null}
        </div>
      );
    },
  };
});

const firstItem: InventoryRiskItem = {
  id: "inventory-1",
  name: "Product 0001",
  onHand: 37,
  risk: "high",
  sku: "SKU-000001",
};

const secondItem: InventoryRiskItem = {
  id: "inventory-2",
  name: "Product 0002",
  onHand: 74,
  risk: "low",
  sku: "SKU-000002",
};

function inventoryPage(
  items: InventoryRiskItem[],
  nextPageParam: string | null,
  total = items.length,
): PageResult<InventoryRiskItem, string> {
  return {
    items,
    nextPageParam,
    total,
  };
}

function renderInventoryRisk(
  activeId: ManageSectionId = "summary",
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ManageScrollProvider
        value={{
          activeId,
          isProgrammaticScrolling: false,
        }}
      >
        <InventoryRiskSection />
      </ManageScrollProvider>
    </QueryClientProvider>,
  );
}

describe("InventoryRiskSection", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("preserves loaded data while a risk filter updates", async () => {
    let resolveFiltered:
      | ((value: PageResult<InventoryRiskItem, string>) => void)
      | undefined;
    const filteredRequest = new Promise<
      PageResult<InventoryRiskItem, string>
    >((resolve) => {
      resolveFiltered = resolve;
    });
    jest
      .spyOn(inventoryRepository, "list")
      .mockResolvedValueOnce(inventoryPage([firstItem, secondItem], null, 2))
      .mockReturnValueOnce(filteredRequest);

    renderInventoryRisk();

    expect(screen.getByText("Loading inventory…")).toBeInTheDocument();
    expect(await screen.findByText("2 matching products")).toBeInTheDocument();
    expect(screen.getByText(firstItem.name)).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Risk" }), {
      target: { value: "high" },
    });

    expect(
      await screen.findByRole("status", { name: "" }),
    ).toHaveTextContent("Updating inventory…");
    expect(screen.getByText(firstItem.name)).toBeInTheDocument();

    resolveFiltered?.(inventoryPage([firstItem], null, 1));

    expect(await screen.findByText("1 matching products")).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByText(secondItem.name),
      ).not.toBeInTheDocument();
    });
  });

  it("autoloads the next page while Inventory is active", async () => {
    const repositorySpy = jest
      .spyOn(inventoryRepository, "list")
      .mockResolvedValueOnce(inventoryPage([firstItem], "1", 2))
      .mockResolvedValueOnce(inventoryPage([secondItem], null, 2));

    renderInventoryRisk("inventory");

    expect(await screen.findByText(firstItem.name)).toBeInTheDocument();
    expect(await screen.findByText(secondItem.name)).toBeInTheDocument();
    expect(repositorySpy).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("inventory-collection")).toHaveAttribute(
      "data-auto-load",
      "true",
    );
  });

  it("keeps loaded items through a next-page failure and retries it", async () => {
    jest
      .spyOn(inventoryRepository, "list")
      .mockResolvedValueOnce(inventoryPage([firstItem], "1", 2))
      .mockRejectedValueOnce(new Error("Next page unavailable"))
      .mockResolvedValueOnce(inventoryPage([secondItem], null, 2));

    renderInventoryRisk("summary");

    expect(await screen.findByText(firstItem.name)).toBeInTheDocument();
    expect(screen.getByTestId("inventory-collection")).toHaveAttribute(
      "data-auto-load",
      "false",
    );

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("The next page failed");
    expect(screen.getByText(firstItem.name)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText(secondItem.name)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("recovers from an initial request failure", async () => {
    jest
      .spyOn(inventoryRepository, "list")
      .mockRejectedValueOnce(new Error("Initial inventory unavailable"))
      .mockResolvedValueOnce(inventoryPage([firstItem], null, 1));

    renderInventoryRisk();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Inventory could not be loaded: Initial inventory unavailable",
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText(firstItem.name)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
