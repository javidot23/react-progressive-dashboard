import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "@storybook/test";
import { CircleDollarSign, LayoutDashboard, Package, TrendingUp, Truck } from "lucide-react";
import { Navbar, type NavbarItem } from "./Navbar";

const linkItems = [
  {
    id: "summary",
    label: "Summary",
    to: "#summary",
    icon: LayoutDashboard,
  },
  {
    id: "inventory",
    label: "Inventory",
    to: "#inventory",
    icon: Package,
  },
  {
    id: "demand",
    label: "Demand",
    to: "#demand",
    icon: TrendingUp,
  },
  {
    id: "supply",
    label: "Supply",
    to: "#supply",
    icon: Truck,
  },
  {
    id: "sales",
    label: "Sales",
    to: "#sales",
    icon: CircleDollarSign,
  },
] satisfies readonly NavbarItem[];

const itemsWithoutIcons = linkItems.map(({ id, label, to }) => ({
  id,
  label,
  to,
}));

const buttonItems = linkItems.map(({ icon, id, label }) => ({
  id,
  label,
  icon,
}));

const iconPositionItems = [
  {
    id: "top",
    label: "Top",
    icon: LayoutDashboard,
    iconPosition: "top",
  },
  {
    id: "right",
    label: "Right",
    icon: Package,
    iconPosition: "right",
  },
  {
    id: "bottom",
    label: "Bottom",
    icon: TrendingUp,
    iconPosition: "bottom",
  },
  {
    id: "left",
    label: "Left",
    icon: Truck,
    iconPosition: "left",
  },
] satisfies readonly NavbarItem[];

const meta = {
  title: "Molecules/Navbar",
  component: Navbar,
  decorators: [
    Story => (
      <div className="min-h-24 bg-slate-50 p-6">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    items: {
      description:
        "Ordered navigation entries. Each `id` must be unique. Providing `to` renders a link; omitting it renders a button. Items can also define an icon and override its position.",
      control: false,
      table: {
        type: { summary: "readonly NavbarItem[]" },
      },
    },
    activeId: {
      description:
        "ID of the currently selected item, or `null` when no item is active. It controls the active styles, ARIA state, and the label shown by the mobile disclosure.",
      control: "select",
      options: [null, ...linkItems.map(item => item.id)],
      table: {
        type: { summary: "string | null" },
      },
    },
    ariaLabel: {
      description:
        "Accessible name for the `<nav>` landmark. Use a concise label that distinguishes this navigation from other landmarks on the page.",
    },
    ariaCurrent: {
      description:
        "Value applied to `aria-current` on the active link item. Use `location` for hash or in-page destinations and `page` for navigation between pages. It does not apply to button items.",
      control: "inline-radio",
      options: ["page", "location"],
      table: {
        defaultValue: { summary: '"page"' },
        type: { summary: '"page" | "location"' },
      },
    },
    className: {
      description:
        "Additional classes for the outer `<nav>` element. Use it for the component surface, border, positioning, or page-level spacing.",
      table: {
        defaultValue: { summary: '""' },
      },
    },
    innerClassName: {
      description:
        "Additional classes for the inner wrapper `<div>`. Use it to constrain width or center the Navbar independently from its outer surface.",
      table: {
        defaultValue: { summary: '""' },
      },
    },
    listClassName: {
      description:
        "Additional classes appended to the responsive `<ul>`. Use sparingly to adjust item spacing or alignment without replacing the built-in disclosure behavior.",
      table: {
        defaultValue: { summary: '""' },
      },
    },
    mobileLabel: {
      description:
        "Base label for the mobile disclosure trigger. When an item is active, its label is appended, for example `Sections: Summary`.",
      table: {
        defaultValue: { summary: '"Sections"' },
      },
    },
    iconPosition: {
      description:
        "Default placement of item icons relative to their labels. An item's own `iconPosition` takes precedence over this value.",
      control: "inline-radio",
      options: ["top", "right", "bottom", "left"],
      table: {
        defaultValue: { summary: '"left"' },
        type: { summary: '"top" | "right" | "bottom" | "left"' },
      },
    },
    onIntent: {
      description:
        "Optional callback fired when an item receives focus or pointer hover. Use it to preload the destination or prepare data before selection.",
      control: false,
      table: {
        type: { summary: "(item: NavbarItem) => void" },
      },
    },
    onSelect: {
      description:
        "Called whenever a link or button item is activated. It receives the selected item and original React mouse event so consumers can preserve modified-link behavior or prevent default navigation.",
      control: false,
      table: {
        type: {
          summary: "(item: NavbarItem, event: NavbarSelectEvent) => void",
        },
      },
    },
  },
  args: {
    items: linkItems,
    activeId: "summary",
    ariaLabel: "Dashboard sections",
    ariaCurrent: "location",
    className: "border-b border-slate-200 bg-white/95 px-6 backdrop-blur",
    innerClassName: "mx-auto max-w-6xl",
    mobileLabel: "Sections",
    iconPosition: "left",
    onIntent: fn(),
    onSelect: fn(),
  },
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithoutIcons: Story = {
  args: {
    items: itemsWithoutIcons,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("list", { hidden: true });

    await expect(list.querySelector("svg")).not.toBeInTheDocument();
  },
};

export const DesktopLinks: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const summaryLink = canvas.getByRole("link", { name: "Summary", hidden: true });
    const inventoryLink = canvas.getByRole("link", { name: "Inventory", hidden: true });

    await expect(summaryLink).toHaveAttribute("aria-current", "location");
    await expect(inventoryLink).not.toHaveAttribute("aria-current");

    await userEvent.hover(inventoryLink);
    await expect(args.onIntent).toHaveBeenCalledWith(expect.objectContaining({ id: "inventory" }));

    await userEvent.click(inventoryLink);
    await expect(args.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "inventory" }), expect.anything());
  },
};

export const AlternateIconPositions: Story = {
  args: {
    items: iconPositionItems,
    activeId: "top",
  },
};

export const ButtonItems: Story = {
  args: {
    items: buttonItems,
    activeId: "inventory",
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const summaryButton = canvas.getByRole("button", { name: "Summary" });
    const inventoryButton = canvas.getByRole("button", {
      name: "Inventory",
    });
    const supplyButton = canvas.getByRole("button", { name: "Supply" });

    await expect(summaryButton).toHaveAttribute("aria-pressed", "false");
    await expect(inventoryButton).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(supplyButton);
    await expect(args.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "supply" }), expect.anything());
  },
};

export const MobileCollapsed: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", {
      name: "Sections: Summary",
    });
    const list = canvas.getByRole("list", { hidden: true });

    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAttribute("aria-controls", list.id);
    await expect(list).toHaveClass("hidden");
  },
};

export const MobileInteraction: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", {
      name: "Sections: Summary",
    });

    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByRole("link", { name: "Inventory" })).toBeVisible();

    await userEvent.keyboard("{Escape}");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveFocus();

    await userEvent.click(toggle);
    await userEvent.click(canvas.getByRole("link", { name: "Inventory" }));

    await expect(args.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "inventory" }), expect.anything());
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveFocus();
  },
};
