import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Navbar, type NavbarItem } from "./Navbar";

const items = [
  { id: "summary", label: "Summary", to: "#summary" },
  { id: "demand", label: "Demand", to: "#demand" },
] satisfies readonly NavbarItem[];

describe("Navbar", () => {
  beforeAll(() => {
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn().mockReturnValue({ matches: false }),
    });
  });

  beforeEach(() => {
    (window.matchMedia as jest.Mock).mockReturnValue({ matches: false });
  });

  function renderNavbar(
    props: Partial<React.ComponentProps<typeof Navbar>> = {},
  ) {
    const onSelect = jest.fn();
    const onIntent = jest.fn();

    render(
      <MemoryRouter initialEntries={["/dashboard#summary"]}>
        <Navbar
          items={items}
          activeId="summary"
          ariaLabel="Dashboard sections"
          ariaCurrent="location"
          onSelect={onSelect}
          onIntent={onIntent}
          {...props}
        />
      </MemoryRouter>,
    );

    return { onIntent, onSelect };
  }

  it("keeps the disclosure behavior as the default mobile mode", () => {
    renderNavbar();

    const navigation = screen.getByRole("navigation", {
      name: "Dashboard sections",
    });
    const toggle = screen.getByRole("button", {
      name: "Sections: Summary",
    });
    const list = screen.getByRole("list", { hidden: true });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(list).toHaveClass("hidden");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(list).toHaveClass("flex");

    fireEvent.keyDown(navigation, { key: "Escape" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });

  it("renders a visible, controlled horizontal list without a disclosure", () => {
    const { onIntent, onSelect } = renderNavbar({
      mobileMode: "horizontal-scroll",
    });

    expect(
      screen.queryByRole("button", { name: "Sections: Summary" }),
    ).not.toBeInTheDocument();

    const list = screen.getByRole("list");
    const summaryLink = screen.getByRole("link", { name: "Summary" });
    const demandLink = screen.getByRole("link", { name: "Demand" });

    expect(list).toHaveClass("overflow-x-auto", "whitespace-nowrap");
    expect(list).not.toHaveClass("hidden");
    expect(summaryLink).toHaveAttribute("aria-current", "location");
    expect(demandLink).not.toHaveAttribute("aria-current");

    fireEvent.pointerEnter(demandLink);
    fireEvent.click(demandLink);

    expect(onIntent).toHaveBeenCalledWith(
      expect.objectContaining({ id: "demand" }),
    );
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "demand" }),
      expect.anything(),
    );
  });

  it("keeps a programmatically active horizontal item visible", async () => {
    const onSelect = jest.fn();
    const renderComponent = (activeId: string) => (
      <MemoryRouter initialEntries={["/dashboard#summary"]}>
        <Navbar
          items={items}
          activeId={activeId}
          ariaLabel="Dashboard sections"
          ariaCurrent="location"
          mobileMode="horizontal-scroll"
          onSelect={onSelect}
        />
      </MemoryRouter>
    );
    const { rerender } = render(renderComponent("summary"));
    const list = screen.getByRole("list");
    const demandListItem = screen.getByRole("link", {
      name: "Demand",
    }).closest("li");
    const summaryListItem = screen.getByRole("link", {
      name: "Summary",
    }).closest("li");
    const scrollTo = jest.fn();
    const createRect = (left: number, right: number): DOMRect => ({
      bottom: 64,
      height: 64,
      left,
      right,
      top: 0,
      width: right - left,
      x: left,
      y: 0,
      toJSON: () => ({}),
    });

    expect(demandListItem).not.toBeNull();
    expect(summaryListItem).not.toBeNull();

    Object.defineProperty(list, "scrollLeft", {
      configurable: true,
      value: 0,
      writable: true,
    });
    Object.defineProperty(list, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });
    jest
      .spyOn(list, "getBoundingClientRect")
      .mockReturnValue(createRect(0, 200));
    jest
      .spyOn(demandListItem!, "getBoundingClientRect")
      .mockReturnValue(createRect(220, 300));

    rerender(renderComponent("demand"));

    await waitFor(() => {
      expect(scrollTo).toHaveBeenCalledWith({
        behavior: "smooth",
        left: 100,
      });
    });

    scrollTo.mockClear();
    (window.matchMedia as jest.Mock).mockReturnValue({ matches: true });
    jest
      .spyOn(summaryListItem!, "getBoundingClientRect")
      .mockReturnValue(createRect(-100, -20));

    rerender(renderComponent("summary"));

    await waitFor(() => {
      expect(scrollTo).toHaveBeenCalledWith({
        behavior: "auto",
        left: 0,
      });
    });
  });

  it("preserves manual horizontal exploration across equivalent item arrays", () => {
    const onSelect = jest.fn();
    const renderComponent = () => (
      <MemoryRouter initialEntries={["/dashboard#summary"]}>
        <Navbar
          items={[...items]}
          activeId="summary"
          ariaLabel="Dashboard sections"
          mobileMode="horizontal-scroll"
          onSelect={onSelect}
        />
      </MemoryRouter>
    );
    const { rerender } = render(renderComponent());
    const list = screen.getByRole("list");
    const summaryListItem = screen.getByRole("link", {
      name: "Summary",
    }).closest("li");
    const scrollTo = jest.fn();
    const createRect = (left: number, right: number): DOMRect => ({
      bottom: 64,
      height: 64,
      left,
      right,
      top: 0,
      width: right - left,
      x: left,
      y: 0,
      toJSON: () => ({}),
    });

    expect(summaryListItem).not.toBeNull();

    Object.defineProperty(list, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });
    jest
      .spyOn(list, "getBoundingClientRect")
      .mockReturnValue(createRect(0, 200));
    jest
      .spyOn(summaryListItem!, "getBoundingClientRect")
      .mockReturnValue(createRect(-100, -20));

    rerender(renderComponent());

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
