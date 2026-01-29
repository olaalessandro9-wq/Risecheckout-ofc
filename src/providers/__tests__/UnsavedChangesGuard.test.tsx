/**
 * UnsavedChangesGuard Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Testes de integração para UnsavedChangesGuard.
 * Valida registro automático no NavigationGuardProvider e geração de IDs.
 * 
 * @module providers/__tests__/UnsavedChangesGuard.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UnsavedChangesGuard } from "../UnsavedChangesGuard";
import { NavigationGuardProvider, useNavigationGuard } from "../NavigationGuardProvider";

// ============================================================================
// MOCKS
// ============================================================================

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useBlocker: vi.fn(() => ({
      state: "unblocked",
      proceed: vi.fn(),
      reset: vi.fn(),
    })),
  };
});

// ============================================================================
// TEST HELPERS
// ============================================================================

function DirtyStateReader() {
  const { hasAnyDirty, isDirtyById } = useNavigationGuard();
  return (
    <div>
      <span data-testid="has-any-dirty">{hasAnyDirty() ? "yes" : "no"}</span>
      <span data-testid="custom-id-dirty">{isDirtyById("custom-id") ? "yes" : "no"}</span>
    </div>
  );
}

function renderWithProvider(ui: React.ReactNode) {
  return render(
    <MemoryRouter>
      <NavigationGuardProvider>
        {ui}
        <DirtyStateReader />
      </NavigationGuardProvider>
    </MemoryRouter>
  );
}

// ============================================================================
// UNSAVED CHANGES GUARD TESTS
// ============================================================================

describe("UnsavedChangesGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza children", () => {
    renderWithProvider(
      <UnsavedChangesGuard isDirty={false}>
        <div data-testid="child">Child Content</div>
      </UnsavedChangesGuard>
    );

    expect(screen.getByTestId("child")).toHaveTextContent("Child Content");
  });

  it("gera ID automático se não fornecido", () => {
    renderWithProvider(
      <UnsavedChangesGuard isDirty={true}>
        <div>Content</div>
      </UnsavedChangesGuard>
    );

    // Should register with auto-generated ID
    expect(screen.getByTestId("has-any-dirty")).toHaveTextContent("yes");
  });

  it("usa ID fornecido quando disponível", () => {
    renderWithProvider(
      <UnsavedChangesGuard isDirty={true} id="custom-id">
        <div>Content</div>
      </UnsavedChangesGuard>
    );

    expect(screen.getByTestId("custom-id-dirty")).toHaveTextContent("yes");
  });

  it("registra como dirty quando isDirty=true", () => {
    renderWithProvider(
      <UnsavedChangesGuard isDirty={true} id="custom-id">
        <div>Content</div>
      </UnsavedChangesGuard>
    );

    expect(screen.getByTestId("has-any-dirty")).toHaveTextContent("yes");
  });

  it("registra como não-dirty quando isDirty=false", () => {
    renderWithProvider(
      <UnsavedChangesGuard isDirty={false} id="custom-id">
        <div>Content</div>
      </UnsavedChangesGuard>
    );

    expect(screen.getByTestId("custom-id-dirty")).toHaveTextContent("no");
    expect(screen.getByTestId("has-any-dirty")).toHaveTextContent("no");
  });

  it("atualiza registro quando isDirty muda", () => {
    const { rerender } = render(
      <MemoryRouter>
        <NavigationGuardProvider>
          <UnsavedChangesGuard isDirty={false} id="custom-id">
            <div>Content</div>
          </UnsavedChangesGuard>
          <DirtyStateReader />
        </NavigationGuardProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("custom-id-dirty")).toHaveTextContent("no");

    rerender(
      <MemoryRouter>
        <NavigationGuardProvider>
          <UnsavedChangesGuard isDirty={true} id="custom-id">
            <div>Content</div>
          </UnsavedChangesGuard>
          <DirtyStateReader />
        </NavigationGuardProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("custom-id-dirty")).toHaveTextContent("yes");
  });

  it("faz unregister ao desmontar", () => {
    const { rerender } = render(
      <MemoryRouter>
        <NavigationGuardProvider>
          <UnsavedChangesGuard isDirty={true} id="custom-id">
            <div>Content</div>
          </UnsavedChangesGuard>
          <DirtyStateReader />
        </NavigationGuardProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("custom-id-dirty")).toHaveTextContent("yes");

    rerender(
      <MemoryRouter>
        <NavigationGuardProvider>
          <DirtyStateReader />
        </NavigationGuardProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("custom-id-dirty")).toHaveTextContent("no");
  });

  it("props deprecated não afetam comportamento", () => {
    renderWithProvider(
      <UnsavedChangesGuard 
        isDirty={true} 
        id="custom-id"
        title="Deprecated Title"
        description="Deprecated Description"
        cancelText="Deprecated Cancel"
        confirmText="Deprecated Confirm"
      >
        <div>Content</div>
      </UnsavedChangesGuard>
    );

    // Should still work normally
    expect(screen.getByTestId("custom-id-dirty")).toHaveTextContent("yes");
  });

  it("funciona com múltiplos guards simultâneos", () => {
    render(
      <MemoryRouter>
        <NavigationGuardProvider>
          <UnsavedChangesGuard isDirty={true} id="guard-1">
            <div>Guard 1</div>
          </UnsavedChangesGuard>
          <UnsavedChangesGuard isDirty={false} id="guard-2">
            <div>Guard 2</div>
          </UnsavedChangesGuard>
          <DirtyStateReader />
        </NavigationGuardProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("has-any-dirty")).toHaveTextContent("yes");
  });
});
