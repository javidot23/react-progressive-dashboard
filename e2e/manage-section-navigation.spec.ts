import {
  expect,
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
  inventory: "Inventory",
  demand: "Demand",
  supply: "Supply",
  sales: "Sales",
} as const;

type SectionId = keyof typeof sectionLabels;

function sectionLink(page: Page, id: SectionId) {
  return page
    .getByRole("navigation", { name: "Manage sections" })
    .getByRole("link", {
      name: sectionLabels[id],
      exact: true,
      includeHidden: true,
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
  await page.goto(`/manage-v2#${id}`);
  await expect(page).toHaveURL(new RegExp(`#${id}$`));
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

test.describe("Manage section navigation", () => {
  test("navigates across cold Inventory without activating intermediate sections or losing alignment", async ({
    page,
  }) => {
    // Every test starts with a fresh browser context and QueryClient. Click as
    // soon as the initial current link is available so Inventory cannot be
    // warmed by a previous navigation or test.
    await page.goto("/manage-v2#summary");
    await expect(sectionLink(page, "summary")).toHaveAttribute(
      "aria-current",
      "location",
    );
    await expect(page.getByText("Loading inventory…")).toBeAttached({
      timeout: 2_000,
    });

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
      "sales",
    );

    // The selected destination becomes active immediately, while the local
    // Inventory request and its resulting geometry change complete.
    expect(immediateSelection.activeLabel).toBe("Sales");
    expect(immediateSelection.targetTop).toBeGreaterThan(1_000);
    await expectActiveSection(page, "sales");
    await expect(page.getByRole("heading", { name: "Inventory" })).toBeAttached();
    await expectSectionAligned(page, "sales");

    const activeHistory = await page.evaluate(
      () =>
        (
          window as Window & {
            __manageActiveHistory?: string[];
          }
        ).__manageActiveHistory ?? [],
    );

    expect(activeHistory).toContain("Sales");
    expect(activeHistory).not.toContain("Inventory");
    expect(activeHistory).not.toContain("Demand");
    expect(activeHistory).not.toContain("Supply");

    await selectSection(page, "summary");
  });

  for (const id of ["demand", "supply", "sales"] as const) {
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
    await sectionLink(page, "demand").click();
    await expect(page).toHaveURL(/#demand$/);
    await expectActiveSection(page, "demand");
    await expectSectionAligned(page, "demand");
    await page.reload();
    await expect(page).toHaveURL(/#demand$/);
    await expectActiveSection(page, "demand");
    await expectSectionAligned(page, "demand");
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

  test("returns active-section control to the scroll spy after navigation", async ({
    page,
  }) => {
    await openSection(page, "summary");
    const interruptedSelection = await selectSectionOnFirstFrame(
      page,
      "sales",
    );
    expect(interruptedSelection.activeLabel).toBe("Sales");
    expect(interruptedSelection.targetTop).toBeGreaterThan(1_000);

    // Interrupt the smooth transaction before its stability confirmation.
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
    await expect(
      page.getByRole("heading", { name: "Demand", exact: true }),
    ).toBeAttached();
  });

  test("aligns the destination using its computed scroll margin", async ({
    page,
  }) => {
    await openSection(page, "summary");
    await selectSection(page, "demand");

    const geometry = await page.locator("#demand").evaluate((element) => {
      const node = element as HTMLElement;

      return {
        top: node.getBoundingClientRect().top,
        scrollMarginTop:
          Number.parseFloat(getComputedStyle(node).scrollMarginTop) || 0,
      };
    });

    expect(Math.abs(geometry.top - geometry.scrollMarginTop)).toBeLessThanOrEqual(
      5,
    );
  });

  test("keeps the navigation usable without horizontal page scrolling at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await openSection(page, "summary");

    const toggle = page.getByRole("button", {
      name: /^Sections:/,
    });
    await expect(toggle).toHaveAccessibleName("Sections: Summary");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    await sectionLink(page, "sales").click();

    await expectActiveSection(page, "sales");
    await expectSectionAligned(page, "sales");
    await expect(toggle).toHaveAccessibleName("Sections: Sales");
    await expect(toggle).toBeFocused();
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
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        ),
      )
      .toBe(true);
    await page.evaluate(() => {
      const state = window as Window & {
        __manageScrollBehaviors?: string[];
      };
      state.__manageScrollBehaviors = [];
    });

    await sectionLink(page, "sales").click();

    await expectActiveSection(page, "sales");
    await expectSectionAligned(page, "sales");
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
