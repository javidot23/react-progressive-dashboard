import {
  createSectionNavigationState,
  sectionNavigationReducer,
  type SectionNavigationState,
} from "./sectionNavigationReducer";

type SectionId = "alpha" | "beta" | "gamma";

describe("sectionNavigationReducer", () => {
  it("inicia en idle con la sección inicial activa", () => {
    expect(
      createSectionNavigationState<SectionId>({
        initialId: "alpha",
      }),
    ).toEqual({
      activeId: "alpha",
      phase: { kind: "idle" },
    });
  });

  it("inicia una navegación inicial como transacción programática", () => {
    expect(
      createSectionNavigationState<SectionId>({
        initialId: "alpha",
        initialNavigation: {
          targetId: "gamma",
          origin: "history",
          behavior: "auto",
        },
      }),
    ).toEqual({
      activeId: "gamma",
      phase: {
        kind: "programmatic",
        targetId: "gamma",
        origin: "history",
        behavior: "auto",
        transactionId: 1,
      },
    });
  });

  it("activa inmediatamente el destino solicitado", () => {
    const initialState: SectionNavigationState<SectionId> = {
      activeId: "alpha",
      phase: { kind: "idle" },
    };

    expect(
      sectionNavigationReducer(initialState, {
        type: "navigationRequested",
        request: {
          targetId: "gamma",
          origin: "selection",
          behavior: "smooth",
        },
        transactionId: 4,
      }),
    ).toEqual({
      activeId: "gamma",
      phase: {
        kind: "programmatic",
        targetId: "gamma",
        origin: "selection",
        behavior: "smooth",
        transactionId: 4,
      },
    });
  });

  it("acepta el scroll spy solo cuando está idle", () => {
    const idleState: SectionNavigationState<SectionId> = {
      activeId: "alpha",
      phase: { kind: "idle" },
    };
    const observedState = sectionNavigationReducer(idleState, {
      type: "scrollSpyObserved",
      id: "beta",
    });

    expect(observedState.activeId).toBe("beta");
    expect(
      sectionNavigationReducer(
        {
          activeId: "gamma",
          phase: {
            kind: "programmatic",
            targetId: "gamma",
            origin: "selection",
            behavior: "smooth",
            transactionId: 2,
          },
        },
        {
          type: "scrollSpyObserved",
          id: "beta",
        },
      ),
    ).toEqual({
      activeId: "gamma",
      phase: {
        kind: "programmatic",
        targetId: "gamma",
        origin: "selection",
        behavior: "smooth",
        transactionId: 2,
      },
    });
  });

  it("preserva la referencia de estado si el scroll spy repite el activo", () => {
    const state: SectionNavigationState<SectionId> = {
      activeId: "beta",
      phase: { kind: "idle" },
    };

    expect(
      sectionNavigationReducer(state, {
        type: "scrollSpyObserved",
        id: "beta",
      }),
    ).toBe(state);
  });

  it.each(["navigationCompleted", "navigationFailed"] as const)(
    "solo procesa %s para la transacción vigente",
    (type) => {
      const state: SectionNavigationState<SectionId> = {
        activeId: "gamma",
        phase: {
          kind: "programmatic",
          targetId: "gamma",
          origin: "selection",
          behavior: "smooth",
          transactionId: 8,
        },
      };

      expect(
        sectionNavigationReducer(state, {
          type,
          transactionId: 7,
        }),
      ).toBe(state);
      expect(
        sectionNavigationReducer(state, {
          type,
          transactionId: 8,
        }),
      ).toEqual({
        activeId: "gamma",
        phase: { kind: "idle" },
      });
    },
  );

  it("una navegación nueva reemplaza la transacción anterior", () => {
    const state: SectionNavigationState<SectionId> = {
      activeId: "beta",
      phase: {
        kind: "programmatic",
        targetId: "beta",
        origin: "selection",
        behavior: "smooth",
        transactionId: 3,
      },
    };
    const nextState = sectionNavigationReducer(state, {
      type: "navigationRequested",
      request: {
        targetId: "gamma",
        origin: "history",
        behavior: "auto",
      },
      transactionId: 4,
    });

    expect(nextState.activeId).toBe("gamma");
    expect(
      sectionNavigationReducer(nextState, {
        type: "navigationCompleted",
        transactionId: 3,
      }),
    ).toBe(nextState);
  });
});
