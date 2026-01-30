/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * UTMifyForm - Testes Unitários
 * 
 * Testa o componente principal do formulário UTMify.
 * Cobre estados de loading, erro, sucesso, e interações.
 * 
 * @version 1.0.0
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UTMifyForm } from "../UTMifyForm";
import type { UTMifyContextValue } from "../../context/UTMifyContext";

// ============================================
// MOCKS
// ============================================

const mockSave = vi.fn();
const mockRefresh = vi.fn();
const mockToggleActive = vi.fn();

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
  toggleActive: mockToggleActive,
  toggleProduct: vi.fn(),
  toggleEvent: vi.fn(),
  save: mockSave,
  refresh: mockRefresh,
  matches: vi.fn(),
  ...overrides,
});

vi.mock("../../context", () => ({
  useUTMifyContext: () => mockContext,
}));

// Mock child components
vi.mock("../TokenInput", () => ({
  TokenInput: () => <div data-testid="token-input">TokenInput</div>,
}));

vi.mock("../ProductSelector", () => ({
  ProductSelector: () => <div data-testid="product-selector">ProductSelector</div>,
}));

vi.mock("../EventSelector", () => ({
  EventSelector: () => <div data-testid="event-selector">EventSelector</div>,
}));

let mockContext: UTMifyContextValue;

// ============================================
// TESTS: LOADING STATE
// ============================================

describe("UTMifyForm - Loading State", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext({ isLoading: true, isReady: false });
  });

  it("should render card title", () => {
    render(<UTMifyForm />);
    expect(screen.getByText("UTMify")).toBeInTheDocument();
  });

  it("should render card description", () => {
    render(<UTMifyForm />);
    expect(screen.getByText("Trackeamento de conversões com parâmetros UTM")).toBeInTheDocument();
  });

  it("should show loading spinner", () => {
    const { container } = render(<UTMifyForm />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it("should not show form fields when loading", () => {
    render(<UTMifyForm />);
    expect(screen.queryByTestId("token-input")).not.toBeInTheDocument();
  });

  it("should not show save button when loading", () => {
    render(<UTMifyForm />);
    expect(screen.queryByText("Salvar Configuração")).not.toBeInTheDocument();
  });
});

// ============================================
// TESTS: ERROR STATE
// ============================================

describe("UTMifyForm - Error State", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext({ 
      isError: true, 
      isReady: false,
      error: "Erro ao carregar dados" 
    });
  });

  it("should render card title", () => {
    render(<UTMifyForm />);
    expect(screen.getByText("UTMify")).toBeInTheDocument();
  });

  it("should show error message", () => {
    render(<UTMifyForm />);
    expect(screen.getByText("Erro ao carregar dados")).toBeInTheDocument();
  });

  it("should show default error when no message", () => {
    mockContext = createMockContext({ 
      isError: true, 
      isReady: false,
      error: null 
    });
    render(<UTMifyForm />);
    expect(screen.getByText("Erro ao carregar configuração")).toBeInTheDocument();
  });

  it("should show retry button", () => {
    render(<UTMifyForm />);
    expect(screen.getByText("Tentar novamente")).toBeInTheDocument();
  });

  it("should call refresh when retry clicked", () => {
    render(<UTMifyForm />);
    const retryButton = screen.getByText("Tentar novamente");
    fireEvent.click(retryButton);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("should not show form fields when error", () => {
    render(<UTMifyForm />);
    expect(screen.queryByTestId("token-input")).not.toBeInTheDocument();
  });
});

// ============================================
// TESTS: READY STATE - RENDERING
// ============================================

describe("UTMifyForm - Ready State (Rendering)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext({ isReady: true });
  });

  it("should render card title", () => {
    render(<UTMifyForm />);
    expect(screen.getByText("UTMify")).toBeInTheDocument();
  });

  it("should render card description", () => {
    render(<UTMifyForm />);
    expect(screen.getByText("Trackeamento de conversões com parâmetros UTM")).toBeInTheDocument();
  });

  it("should render TokenInput component", () => {
    render(<UTMifyForm />);
    expect(screen.getByTestId("token-input")).toBeInTheDocument();
  });

  it("should render ProductSelector component", () => {
    render(<UTMifyForm />);
    expect(screen.getByTestId("product-selector")).toBeInTheDocument();
  });

  it("should render EventSelector component", () => {
    render(<UTMifyForm />);
    expect(screen.getByTestId("event-selector")).toBeInTheDocument();
  });

  it("should render save button", () => {
    render(<UTMifyForm />);
    expect(screen.getByText("Salvar Configuração")).toBeInTheDocument();
  });

  it("should render active switch", () => {
    render(<UTMifyForm />);
    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeInTheDocument();
  });

  it("should render active label", () => {
    render(<UTMifyForm />);
    expect(screen.getByText("Ativo")).toBeInTheDocument();
  });
});

// ============================================
// TESTS: ACTIVE/INACTIVE STATE
// ============================================

describe("UTMifyForm - Active/Inactive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show INATIVO badge when inactive", () => {
    mockContext = createMockContext({ active: false });
    render(<UTMifyForm />);
    expect(screen.getByText("INATIVO")).toBeInTheDocument();
  });

  it("should show ATIVO badge when active", () => {
    mockContext = createMockContext({ active: true });
    render(<UTMifyForm />);
    expect(screen.getByText("ATIVO")).toBeInTheDocument();
  });

  it("should have switch unchecked when inactive", () => {
    mockContext = createMockContext({ active: false });
    render(<UTMifyForm />);
    const switchElement = screen.getByRole("switch");
    expect(switchElement).not.toBeChecked();
  });

  it("should have switch checked when active", () => {
    mockContext = createMockContext({ active: true });
    render(<UTMifyForm />);
    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeChecked();
  });

  it("should call toggleActive when switch clicked", () => {
    mockContext = createMockContext({ active: false });
    render(<UTMifyForm />);
    const switchElement = screen.getByRole("switch");
    fireEvent.click(switchElement);
    expect(mockToggleActive).toHaveBeenCalledTimes(1);
  });
});

// ============================================
// TESTS: SAVE BUTTON
// ============================================

describe("UTMifyForm - Save Button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext({ isReady: true });
  });

  it("should be enabled when not saving", () => {
    render(<UTMifyForm />);
    const saveButton = screen.getByText("Salvar Configuração");
    expect(saveButton).not.toBeDisabled();
  });

  it("should be disabled when saving", () => {
    mockContext = createMockContext({ isSaving: true });
    render(<UTMifyForm />);
    const saveButton = screen.getByText("Salvar Configuração");
    expect(saveButton).toBeDisabled();
  });

  it("should call save when clicked", () => {
    render(<UTMifyForm />);
    const saveButton = screen.getByText("Salvar Configuração");
    fireEvent.click(saveButton);
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it("should show spinner when saving", () => {
    mockContext = createMockContext({ isSaving: true });
    const { container } = render(<UTMifyForm />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it("should have full width class", () => {
    render(<UTMifyForm />);
    const saveButton = screen.getByText("Salvar Configuração");
    expect(saveButton).toHaveClass("w-full");
  });
});

// ============================================
// TESTS: STATE TRANSITIONS
// ============================================

describe("UTMifyForm - State Transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should transition from loading to ready", () => {
    mockContext = createMockContext({ isLoading: true, isReady: false });
    const { rerender } = render(<UTMifyForm />);
    expect(screen.queryByTestId("token-input")).not.toBeInTheDocument();

    mockContext = createMockContext({ isLoading: false, isReady: true });
    rerender(<UTMifyForm />);
    expect(screen.getByTestId("token-input")).toBeInTheDocument();
  });

  it("should transition from error to ready after refresh", () => {
    mockContext = createMockContext({ isError: true, isReady: false });
    const { rerender } = render(<UTMifyForm />);
    expect(screen.getByText("Tentar novamente")).toBeInTheDocument();

    mockContext = createMockContext({ isError: false, isReady: true });
    rerender(<UTMifyForm />);
    expect(screen.getByTestId("token-input")).toBeInTheDocument();
  });

  it("should handle ready to saving transition", () => {
    mockContext = createMockContext({ isReady: true, isSaving: false });
    const { rerender } = render(<UTMifyForm />);
    const saveButton = screen.getByText("Salvar Configuração");
    expect(saveButton).not.toBeDisabled();

    mockContext = createMockContext({ isReady: true, isSaving: true });
    rerender(<UTMifyForm />);
    expect(saveButton).toBeDisabled();
  });
});
