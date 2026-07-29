import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import App from "./App";

jest.mock("./assets/icons/cencora-logo.svg", () => "cencora-logo.svg");

describe("App routes", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
  });

  it.each([
    ["/", "Overview"],
    ["/react", "React"],
    ["/plan", "Plan"],
  ])("renders %s as an Under Construction route", (path, title) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );

    const routeHeading = screen.getByRole("heading", { level: 1 });

    expect(routeHeading).toHaveTextContent(title);
    expect(routeHeading).toHaveFocus();
    expect(document.title).toBe(
      `${title} – React Progressive Dashboard`,
    );
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Under Construction",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", {
        name: `${title} sections`,
      }),
    ).toHaveTextContent("Under Construction");
  });

  it("changes between construction routes through the fixed primary navigation", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    const primaryNavigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    fireEvent.click(
      within(primaryNavigation).getByRole("link", { name: "React" }),
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "React",
    );
    expect(
      screen.getByRole("navigation", { name: "React sections" }),
    ).toBeInTheDocument();
  });

  it("removes the legacy manage-v2 route", () => {
    render(
      <MemoryRouter initialEntries={["/manage-v2#summary"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "404" }),
    ).toBeInTheDocument();
  });
});
