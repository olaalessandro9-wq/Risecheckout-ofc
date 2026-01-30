/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * EventSelector - Testes Unitários
 * 
 * Testa o componente de seleção múltipla de eventos.
 * Cobre renderização, labels dinâmicos, e badges.
 * 
 * @version 1.0.0
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventSelector } from "../EventSelector";
import type { UTMifyContextValue } from "../../context/UTMifyContext";

// ============================================
// MOCKS
// ============================================

const mockToggleEvent = vi.fn();

const createMockContext = (overrides: Partial<UTMifyContextValue> = {}): UTMifyContextValue => ({
  isLoading: false,
  isReady: true,
  isSaving: false,
  isError: false,
  error: null,
  products: [],
  token: "",
  active: false,
  selectedProducts: [],
  selectedEvents: [],
  hasExistingToken: false,
  updateToken: vi.fn(),
  toggleActive: vi.fn(),
  toggleProduct: vi.fn(),
  toggleEvent: mockToggleEvent,
  save: vi.fn(),
  refresh: vi.fn(),
  matches: vi.fn(),
  ...overrides,
});

vi.mock("../../context", () => ({
  useUTMifyContext: () => mockContext,
}));

vi.mock("../../constants", () => ({
  UTMIFY_EVENTS: [
    { id: "pix_generated", label: "PIX Gerado", description: "Quando o QR Code do PIX é gerado" },
    { id: "purchase_approved", label: "Compra Aprovada", description: "Quando o pagamento é confirmado" },
    { id: "purchase_refused", label: "Compra Recusada", description: "Quando o pagamento é recusado" },
  ],
}));

let mockContext: UTMifyContextValue;

// ============================================
// TESTS: RENDERING - EMPTY STATE
// ============================================

describe("EventSelector - Rendering (Empty)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext({ selectedEvents: [] });
  });

  it("should render label", () => {
    render(<EventSelector />);
    expect(screen.getByText("Eventos")).toBeInTheDocument();
  });

  it("should render button", () => {
    render(<EventSelector />);
    const button = screen.getByRole("combobox");
    expect(button).toBeInTheDocument();
  });

  it("should show empty state text", () => {
    render(<EventSelector />);
    expect(screen.getByText("Selecione os eventos")).toBeInTheDocument();
  });

  it("should not show badges when empty", () => {
    const { container } = render(<EventSelector />);
    const badges = container.querySelectorAll('[class*="badge"]');
    expect(badges.length).toBe(0);
  });

  it("should show chevron icon", () => {
    const { container } = render(<EventSelector />);
    const chevron = container.querySelector('svg');
    expect(chevron).toBeInTheDocument();
  });
});

// ============================================
// TESTS: LABEL DISPLAY
// ============================================

describe("EventSelector - Label Display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show count for single selection", () => {
    mockContext = createMockContext({ 
      selectedEvents: ["pix_generated"] 
    });
    render(<EventSelector />);
    expect(screen.getByText("1 evento(s) selecionado(s)")).toBeInTheDocument();
  });

  it("should show count for multiple selections", () => {
    mockContext = createMockContext({ 
      selectedEvents: ["pix_generated", "purchase_approved"] 
    });
    render(<EventSelector />);
    expect(screen.getByText("2 evento(s) selecionado(s)")).toBeInTheDocument();
  });

  it("should show all events text when all selected", () => {
    mockContext = createMockContext({ 
      selectedEvents: ["pix_generated", "purchase_approved", "purchase_refused"] 
    });
    render(<EventSelector />);
    expect(screen.getByText("Todos os eventos")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: BADGES DISPLAY
// ============================================

describe("EventSelector - Badges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show badge for single selection", () => {
    mockContext = createMockContext({ 
      selectedEvents: ["pix_generated"] 
    });
    render(<EventSelector />);
    expect(screen.getByText("PIX Gerado")).toBeInTheDocument();
  });

  it("should show badges for multiple selections", () => {
    mockContext = createMockContext({ 
      selectedEvents: ["pix_generated", "purchase_approved"] 
    });
    render(<EventSelector />);
    expect(screen.getByText("PIX Gerado")).toBeInTheDocument();
    expect(screen.getByText("Compra Aprovada")).toBeInTheDocument();
  });

  it("should show all badges when all selected", () => {
    mockContext = createMockContext({ 
      selectedEvents: ["pix_generated", "purchase_approved", "purchase_refused"] 
    });
    render(<EventSelector />);
    expect(screen.getByText("PIX Gerado")).toBeInTheDocument();
    expect(screen.getByText("Compra Aprovada")).toBeInTheDocument();
    expect(screen.getByText("Compra Recusada")).toBeInTheDocument();
  });

  it("should not show badges for empty selection", () => {
    mockContext = createMockContext({ selectedEvents: [] });
    render(<EventSelector />);
    expect(screen.queryByText("PIX Gerado")).not.toBeInTheDocument();
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("EventSelector - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle invalid event id gracefully", () => {
    mockContext = createMockContext({ 
      selectedEvents: ["invalid_event_id"] 
    });
    render(<EventSelector />);
    expect(screen.getByText("1 evento(s) selecionado(s)")).toBeInTheDocument();
  });

  it("should handle mixed valid and invalid ids", () => {
    mockContext = createMockContext({ 
      selectedEvents: ["pix_generated", "invalid_id", "purchase_approved"] 
    });
    render(<EventSelector />);
    expect(screen.getByText("PIX Gerado")).toBeInTheDocument();
    expect(screen.getByText("Compra Aprovada")).toBeInTheDocument();
    expect(screen.queryByText("invalid_id")).not.toBeInTheDocument();
  });

  it("should handle empty array", () => {
    mockContext = createMockContext({ selectedEvents: [] });
    render(<EventSelector />);
    expect(screen.getByText("Selecione os eventos")).toBeInTheDocument();
  });

  it("should handle duplicate event ids", () => {
    mockContext = createMockContext({ 
      selectedEvents: ["pix_generated", "pix_generated"] 
    });
    render(<EventSelector />);
    expect(screen.getByText("2 evento(s) selecionado(s)")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: BUTTON ATTRIBUTES
// ============================================

describe("EventSelector - Button Attributes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext();
  });

  it("should have combobox role", () => {
    render(<EventSelector />);
    const button = screen.getByRole("combobox");
    expect(button).toHaveAttribute("role", "combobox");
  });

  it("should have outline variant class", () => {
    render(<EventSelector />);
    const button = screen.getByRole("combobox");
    expect(button).toHaveClass("justify-between");
  });

  it("should be enabled by default", () => {
    render(<EventSelector />);
    const button = screen.getByRole("combobox");
    expect(button).not.toBeDisabled();
  });
});

// ============================================
// TESTS: INTEGRATION WITH CONTEXT
// ============================================

describe("EventSelector - Context Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use selectedEvents from context", () => {
    mockContext = createMockContext({ 
      selectedEvents: ["pix_generated"] 
    });
    render(<EventSelector />);
    expect(screen.getByText("PIX Gerado")).toBeInTheDocument();
  });

  it("should update when context changes", () => {
    mockContext = createMockContext({ selectedEvents: [] });
    const { rerender } = render(<EventSelector />);
    expect(screen.getByText("Selecione os eventos")).toBeInTheDocument();

    mockContext = createMockContext({ 
      selectedEvents: ["purchase_approved"] 
    });
    rerender(<EventSelector />);
    expect(screen.getByText("1 evento(s) selecionado(s)")).toBeInTheDocument();
  });
});
