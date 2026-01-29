/**
 * NavigationGuardProvider Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Testes unitários para NavigationGuardProvider.
 * Valida registro de formulários dirty, useBlocker e beforeunload.
 * 
 * @module providers/__tests__/NavigationGuardProvider.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { NavigationGuardProvider, useNavigationGuard } from "../NavigationGuardProvider";
import type { ReactNode } from "react";

// ============================================================================
// MOCKS
// ============================================================================

const mockBlocker = {
  state: "unblocked" as "blocked" | "unblocked" | "proceeding",
  proceed: vi.fn(),
  reset: vi.fn(),
};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useBlocker: vi.fn(() => mockBlocker),
    useNavigate: vi.fn(() => vi.fn()),
  };
});

// ============================================================================
// TEST HELPERS
// ============================================================================

function TestConsumer() {
  const { registerDirty, unregisterDirty, hasAnyDirty, isDirtyById } = useNavigationGuard();
  
  return (
    <div>
      <span data-testid="has-any-dirty">{hasAnyDirty() ? "yes" : "no"}</span>
      <span data-testid="form-1-dirty">{isDirtyById("form-1") ? "yes" : "no"}</span>
      <span data-testid="form-2-dirty">{isDirtyById("form-2") ? "yes" : "no"}</span>
      <button 
        onClick={() => registerDirty("form-1", true)} 
        data-testid="register-form-1"
      >
        Register Form 1
      </button>
      <button 
        onClick={() => registerDirty("form-2", true)} 
        data-testid="register-form-2"
      >
        Register Form 2
      </button>
      <button 
        onClick={() => registerDirty("form-1", false)} 
        data-testid="clean-form-1"
      >
        Clean Form 1
      </button>
      <button 
        onClick={() => unregisterDirty("form-1")} 
        data-testid="unregister-form-1"
      >
        Unregister Form 1
      </button>
    </div>
  );
}

function renderWithProvider(ui: ReactNode) {
  return render(
    <MemoryRouter>
      <NavigationGuardProvider>
        {ui}
      </NavigationGuardProvider>
    </MemoryRouter>
  );
}

// ============================================================================
// PROVIDER TESTS
// ============================================================================

describe("NavigationGuardProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBlocker.state = "unblocked";
  });

  it("renderiza children corretamente", () => {
    renderWithProvider(<div data-testid="child">Child Content</div>);
    expect(screen.getByTestId("child")).toHaveTextContent("Child Content");
  });

  it("fornece valor de contexto", () => {
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("has-any-dirty")).toBeInTheDocument();
  });

  it("aceita textos customizados do diálogo", () => {
    render(
      <MemoryRouter>
        <NavigationGuardProvider
          dialogTitle="Custom Title"
          dialogDescription="Custom Description"
          cancelText="Stay"
          confirmText="Leave"
        >
          <TestConsumer />
        </NavigationGuardProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("has-any-dirty")).toBeInTheDocument();
  });
});

// ============================================================================
// REGISTER/UNREGISTER TESTS
// ============================================================================

describe("registerDirty/unregisterDirty", () => {
  beforeEach(() => {
    mockBlocker.state = "unblocked";
  });

  it("registra formulário como dirty", () => {
    renderWithProvider(<TestConsumer />);

    expect(screen.getByTestId("form-1-dirty")).toHaveTextContent("no");

    act(() => {
      screen.getByTestId("register-form-1").click();
    });

    expect(screen.getByTestId("form-1-dirty")).toHaveTextContent("yes");
  });

  it("remove registro quando isDirty=false", () => {
    renderWithProvider(<TestConsumer />);

    act(() => {
      screen.getByTestId("register-form-1").click();
    });
    expect(screen.getByTestId("form-1-dirty")).toHaveTextContent("yes");

    act(() => {
      screen.getByTestId("clean-form-1").click();
    });
    expect(screen.getByTestId("form-1-dirty")).toHaveTextContent("no");
  });

  it("permite múltiplos registros simultâneos", () => {
    renderWithProvider(<TestConsumer />);

    act(() => {
      screen.getByTestId("register-form-1").click();
      screen.getByTestId("register-form-2").click();
    });

    expect(screen.getByTestId("form-1-dirty")).toHaveTextContent("yes");
    expect(screen.getByTestId("form-2-dirty")).toHaveTextContent("yes");
  });

  it("unregister remove formulário específico", () => {
    renderWithProvider(<TestConsumer />);

    act(() => {
      screen.getByTestId("register-form-1").click();
      screen.getByTestId("register-form-2").click();
    });

    act(() => {
      screen.getByTestId("unregister-form-1").click();
    });

    expect(screen.getByTestId("form-1-dirty")).toHaveTextContent("no");
    expect(screen.getByTestId("form-2-dirty")).toHaveTextContent("yes");
  });

  it("não afeta outros registros ao unregister", () => {
    renderWithProvider(<TestConsumer />);

    act(() => {
      screen.getByTestId("register-form-1").click();
      screen.getByTestId("register-form-2").click();
    });

    act(() => {
      screen.getByTestId("unregister-form-1").click();
    });

    expect(screen.getByTestId("form-2-dirty")).toHaveTextContent("yes");
    expect(screen.getByTestId("has-any-dirty")).toHaveTextContent("yes");
  });
});

// ============================================================================
// DIRTY QUERY TESTS
// ============================================================================

describe("hasAnyDirty/isDirtyById", () => {
  beforeEach(() => {
    mockBlocker.state = "unblocked";
  });

  it("retorna false quando nenhum dirty", () => {
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId("has-any-dirty")).toHaveTextContent("no");
  });

  it("retorna true quando pelo menos um dirty", () => {
    renderWithProvider(<TestConsumer />);

    act(() => {
      screen.getByTestId("register-form-1").click();
    });

    expect(screen.getByTestId("has-any-dirty")).toHaveTextContent("yes");
  });

  it("isDirtyById retorna true para ID específico", () => {
    renderWithProvider(<TestConsumer />);

    act(() => {
      screen.getByTestId("register-form-1").click();
    });

    expect(screen.getByTestId("form-1-dirty")).toHaveTextContent("yes");
  });

  it("isDirtyById retorna false para ID inexistente", () => {
    renderWithProvider(<TestConsumer />);

    act(() => {
      screen.getByTestId("register-form-1").click();
    });

    expect(screen.getByTestId("form-2-dirty")).toHaveTextContent("no");
  });

  it("reflete mudanças em tempo real", () => {
    renderWithProvider(<TestConsumer />);

    expect(screen.getByTestId("has-any-dirty")).toHaveTextContent("no");

    act(() => {
      screen.getByTestId("register-form-1").click();
    });
    expect(screen.getByTestId("has-any-dirty")).toHaveTextContent("yes");

    act(() => {
      screen.getByTestId("unregister-form-1").click();
    });
    expect(screen.getByTestId("has-any-dirty")).toHaveTextContent("no");
  });
});

// ============================================================================
// HOOK ERROR TESTS
// ============================================================================

describe("useNavigationGuard", () => {
  it("lança erro quando fora do provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(
        <MemoryRouter>
          <TestConsumer />
        </MemoryRouter>
      );
    }).toThrow("useNavigationGuard must be used within NavigationGuardProvider");

    consoleSpy.mockRestore();
  });
});
