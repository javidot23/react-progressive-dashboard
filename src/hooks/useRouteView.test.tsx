import { render, screen } from "@testing-library/react";
import { getRouteTitle, useRouteView } from "./useRouteView";

function TestView({ viewName }: { viewName: string }) {
  const headingRef = useRouteView(viewName);

  return (
    <h1 ref={headingRef} tabIndex={-1}>
      {viewName}
    </h1>
  );
}

describe("useRouteView", () => {
  it("actualiza el título y mueve el foco al encabezado de la vista", () => {
    render(<TestView viewName="Manage" />);

    expect(document.title).toBe(
      "Manage – React Progressive Dashboard",
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Manage" }),
    ).toHaveFocus();
  });

  it("construye títulos únicos conservando el nombre de la aplicación", () => {
    expect(getRouteTitle("Home")).toBe(
      "Home – React Progressive Dashboard",
    );
    expect(getRouteTitle("Not found")).toBe(
      "Not found – React Progressive Dashboard",
    );
  });
});
