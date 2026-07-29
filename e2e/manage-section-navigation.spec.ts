import {
  expect,
  type Locator,
  type Page,
  test as base,
} from "@playwright/test";

type QaFixtures = {
  runtimeErrorGuard: void;
};

const test = base.extend<QaFixtures>({
  runtimeErrorGuard: [
    async ({ page }, use) => {
      const runtimeErrors: string[] = [];

      page.on("pageerror", (error) => {
        runtimeErrors.push(`pageerror: ${error.message}`);
      });
      page.on("console", (message) => {
        if (message.type() === "error") {
          runtimeErrors.push(`console.error: ${message.text()}`);
        }
      });

      await use();

      expect(
        runtimeErrors,
        "expected no uncaught browser errors",
      ).toEqual([]);
    },
    { auto: true },
  ],
});

const sectionLabels = {
  summary: "Summary",
  demand: "Demand",
  orders: "Orders",
  suppliers: "Suppliers",
  inventory: "Inventory",
  sales: "Sales",
  "perfect-order": "Perfect Order",
} as const;

type SectionId = keyof typeof sectionLabels;

function primaryNavigation(page: Page) {
  return page.getByRole("navigation", {
    name: "Primary navigation",
  });
}

function primaryLink(page: Page, name: string) {
  return primaryNavigation(page).getByRole("link", {
    name,
    exact: true,
  });
}

function manageNavigation(page: Page) {
  return page.getByRole("navigation", {
    name: "Manage sections",
  });
}

function sectionLink(page: Page, id: SectionId) {
  return manageNavigation(page).getByRole("link", {
    name: sectionLabels[id],
    exact: true,
  });
}

async function expectActiveSection(page: Page, id: SectionId) {
  await expect(sectionLink(page, id)).toHaveAttribute(
    "aria-current",
    "location",
  );

  for (const candidateId of Object.keys(sectionLabels) as SectionId[]) {
    if (candidateId !== id) {
      await expect(sectionLink(page, candidateId)).not.toHaveAttribute(
        "aria-current",
        "location",
      );
    }
  }
}

async function expectSectionAligned(page: Page, id: SectionId) {
  await expect
    .poll(
      () =>
        page.locator(`#${id}`).evaluate((element) => {
          const node = element as HTMLElement;
          const targetTop =
            node.getBoundingClientRect().top + window.scrollY;
          const scrollMarginTop =
            Number.parseFloat(getComputedStyle(node).scrollMarginTop) || 0;
          const documentHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
          );
          const maximumScrollY = Math.max(
            0,
            documentHeight - window.innerHeight,
          );
          const expectedScrollY = Math.min(
            Math.max(0, targetTop - scrollMarginTop),
            maximumScrollY,
          );

          return Math.abs(window.scrollY - expectedScrollY);
        }),
      {
        message: `expected #${id} to settle at its scroll-margin alignment`,
        timeout: 15_000,
      },
    )
    .toBeLessThanOrEqual(5);
}

async function openSection(page: Page, id: SectionId) {
  await page.goto(`/manage#${id}`);
  await expect(page).toHaveURL(new RegExp(`/manage#${id}$`));
  await expectActiveSection(page, id);
  await expectSectionAligned(page, id);
}

async function selectSection(page: Page, id: SectionId) {
  await sectionLink(page, id).click();
  await expect(page).toHaveURL(new RegExp(`#${id}$`));
  await expectActiveSection(page, id);
  await expectSectionAligned(page, id);
}

async function selectSectionOnFirstFrame(page: Page, id: SectionId) {
  return sectionLink(page, id).evaluate(
    async (link, targetId) => {
      (link as HTMLElement).click();
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });

      return {
        activeLabel: document
          .querySelector('a[aria-current="location"]')
          ?.textContent?.trim(),
        targetTop:
          document
            .getElementById(targetId)
            ?.getBoundingClientRect().top ?? 0,
      };
    },
    id,
  );
}

async function expectDisabledHeaderActions(page: Page | Locator) {
  for (const label of ["Notifications", "Settings", "Profile"]) {
    await expect(
      page.getByRole("button", { name: label }),
    ).toBeDisabled();
    await expect(
      page.getByRole("link", { name: label }),
    ).toHaveCount(0);
  }
}

test.describe("Dashboard routes", () => {
  for (const route of [
    {
      path: "/",
      title: "Overview",
      navigationName: "Overview sections",
    },
    {
      path: "/react",
      title: "React",
      navigationName: "React sections",
    },
    {
      path: "/plan",
      title: "Plan",
      navigationName: "Plan sections",
    },
  ]) {
    test(`${route.title} exposes one Under Construction section`, async ({
      page,
    }) => {
      await page.goto(route.path);

      await expect(primaryLink(page, route.title)).toHaveAttribute(
        "aria-current",
        "page",
      );
      const sectionNavigation = page.getByRole("navigation", {
        name: route.navigationName,
      });
      await expect(sectionNavigation.getByRole("link")).toHaveText(
        "Under Construction",
      );
      await expect(
        page.getByRole("heading", {
          level: 2,
          name: "Under Construction",
        }),
      ).toBeVisible();
      await expectDisabledHeaderActions(page);
    });
  }

  test("the removed manage-v2 route falls through to 404", async ({
    page,
  }) => {
    await page.goto("/manage-v2#summary");

    await expect(
      page.getByRole("heading", { level: 1, name: "404" }),
    ).toBeVisible();
  });
});

test.describe("Manage section navigation", () => {
  test("renders the requested navigation contract and sticky geometry", async ({
    page,
  }) => {
    await page.goto("/manage#summary");

    await expect(primaryLink(page, "Manage")).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(
      manageNavigation(page)
        .getByRole("link")
        .allTextContents(),
    ).resolves.toEqual(Object.values(sectionLabels));
    await expectDisabledHeaderActions(page);

    const geometry = await page.locator("header").evaluate((header) => ({
      height: header.getBoundingClientRect().height,
      position: getComputedStyle(header).position,
      top: getComputedStyle(header).top,
    }));

    expect(geometry).toEqual({
      height: 104,
      position: "sticky",
      top: "0px",
    });
  });

  test("navigates to Perfect Order without activating intermediate sections", async ({
    page,
  }) => {
    await page.goto("/manage#summary");
    await expectActiveSection(page, "summary");

    await page.evaluate(() => {
      const state = window as Window & {
        __manageActiveHistory?: string[];
      };
      state.__manageActiveHistory = [];
      const navigation = document.querySelector(
        'nav[aria-label="Manage sections"]',
      );

      const recordCurrentSection = () => {
        const current = navigation?.querySelector(
          'a[aria-current="location"]',
        );
        const label = current?.textContent?.trim();
        const previous = state.__manageActiveHistory?.at(-1);

        if (label && label !== previous) {
          state.__manageActiveHistory?.push(label);
        }
      };

      recordCurrentSection();
      new MutationObserver(recordCurrentSection).observe(navigation!, {
        attributes: true,
        attributeFilter: ["aria-current"],
        subtree: true,
      });
    });

    const immediateSelection = await selectSectionOnFirstFrame(
      page,
      "perfect-order",
    );

    expect(immediateSelection.activeLabel).toBe("Perfect Order");
    expect(immediateSelection.targetTop).toBeGreaterThan(1_000);
    await expectActiveSection(page, "perfect-order");
    await expectSectionAligned(page, "perfect-order");
    await expect(
      page.getByRole("heading", {
        name: "Perfect Order",
        exact: true,
      }),
    ).toBeAttached();

    const activeHistory = await page.evaluate(
      () =>
        (
          window as Window & {
            __manageActiveHistory?: string[];
          }
        ).__manageActiveHistory ?? [],
    );

    expect(activeHistory).toContain("Perfect Order");
    for (const intermediate of [
      "Demand",
      "Orders",
      "Suppliers",
      "Inventory",
      "Sales",
    ]) {
      expect(activeHistory).not.toContain(intermediate);
    }
  });

  for (const id of [
    "demand",
    "orders",
    "suppliers",
    "inventory",
    "sales",
    "perfect-order",
  ] as const) {
    test(`restores and aligns a deep #${id} URL after refresh`, async ({
      page,
    }) => {
      await openSection(page, id);
      await page.reload();

      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expectActiveSection(page, id);
      await expectSectionAligned(page, id);
    });
  }

  test("restores the correct section through browser back and forward", async ({
    page,
  }) => {
    await openSection(page, "summary");
    await selectSection(page, "demand");
    await selectSection(page, "sales");

    await page.goBack();
    await expect(page).toHaveURL(/#demand$/);
    await expectActiveSection(page, "demand");
    await expectSectionAligned(page, "demand");

    await page.goForward();
    await expect(page).toHaveURL(/#sales$/);
    await expectActiveSection(page, "sales");
    await expectSectionAligned(page, "sales");
  });

  test("reselecting Manage resets the current section to Summary", async ({
    page,
  }) => {
    await openSection(page, "sales");
    await primaryLink(page, "Manage").click();

    await expect(page).toHaveURL(/\/manage#summary$/);
    await expectActiveSection(page, "summary");
    await expectSectionAligned(page, "summary");
  });

  test("returns active-section control to the scroll spy after interruption", async ({
    page,
  }) => {
    await openSection(page, "summary");
    const interruptedSelection = await selectSectionOnFirstFrame(
      page,
      "perfect-order",
    );
    expect(interruptedSelection.activeLabel).toBe("Perfect Order");
    expect(interruptedSelection.targetTop).toBeGreaterThan(1_000);

    await page.mouse.wheel(0, -100_000);

    await expectActiveSection(page, "summary");
    await expect(page).toHaveURL(/#summary$/);
    await expectSectionAligned(page, "summary");
  });

  test("activates a lazy section reached only through manual scrolling", async ({
    page,
  }) => {
    await openSection(page, "summary");

    const wheelDelta = await page.locator("#demand").evaluate((element) => {
      const node = element as HTMLElement;
      const scrollMarginTop =
        Number.parseFloat(getComputedStyle(node).scrollMarginTop) || 0;

      return node.getBoundingClientRect().top - scrollMarginTop;
    });
    await page.mouse.wheel(0, wheelDelta);

    await expect(page).toHaveURL(/#demand$/);
    await expectActiveSection(page, "demand");
    await expectSectionAligned(page, "demand");
  });

  test("keeps the mobile Header and section navigation usable at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await openSection(page, "summary");

    await expect(manageNavigation(page).getByRole("list")).toHaveClass(
      /overflow-x-auto/,
    );
    await expectDisabledHeaderActions(page);
    await page
      .getByRole("button", { name: "Open navigation menu" })
      .click();

    const dialog = page.getByRole("dialog", {
      name: "Navigation menu",
    });
    const dialogPrimaryNavigation = dialog.getByRole("navigation", {
      name: "Primary navigation",
    });
    const manageItem = dialogPrimaryNavigation
      .getByRole("link", { name: "Manage" })
      .locator("..");
    const nestedSections = manageItem.getByRole("list", {
      name: "Manage sections",
    });

    await expect(dialogPrimaryNavigation.getByRole("link")).toHaveCount(11);
    await expect(nestedSections.getByRole("link")).toHaveCount(7);
    await nestedSections.getByRole("link", { name: "Sales" }).click();

    await expect(dialog).not.toBeVisible();
    await expectActiveSection(page, "sales");
    await expectSectionAligned(page, "sales");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
      )
      .toBeLessThanOrEqual(0);
  });
});

test.describe("Manage section navigation with reduced motion", () => {
  test("uses instant scrolling for a selected destination", async ({ page }) => {
    await page.addInitScript(() => {
      const state = window as Window & {
        __manageScrollBehaviors?: string[];
      };
      state.__manageScrollBehaviors = [];
      const nativeScrollIntoView = HTMLElement.prototype.scrollIntoView;

      HTMLElement.prototype.scrollIntoView = function scrollIntoView(
        options?: boolean | ScrollIntoViewOptions,
      ) {
        if (typeof options === "object") {
          state.__manageScrollBehaviors?.push(options.behavior ?? "auto");
        }

        nativeScrollIntoView.call(this, options);
      };
    });
    await page.emulateMedia({ reducedMotion: "reduce" });

    await openSection(page, "summary");
    await page.evaluate(() => {
      const state = window as Window & {
        __manageScrollBehaviors?: string[];
      };
      state.__manageScrollBehaviors = [];
    });

    await sectionLink(page, "perfect-order").click();

    await expectActiveSection(page, "perfect-order");
    await expectSectionAligned(page, "perfect-order");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (
              window as Window & {
                __manageScrollBehaviors?: string[];
              }
            ).__manageScrollBehaviors?.[0],
        ),
      )
      .toBe("auto");
  });
});
