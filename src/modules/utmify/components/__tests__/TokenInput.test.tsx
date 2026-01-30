/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * TokenInput - Testes Unitários
 * 
 * Testa o componente de input de API Token.
 * Cobre renderização, estados (novo/existente), e interações.
 * 
 * @version 1.0.0
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TokenInput } from "../TokenInput";
import type { UTMifyContextValue } from "../../context/UTMifyContext";

// ============================================
// MOCKS
// ============================================

const mockUpdateToken = vi.fn();

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
  updateToken: mockUpdateToken,
  toggleActive: vi.fn(),
  toggleProduct: vi.fn(),
  toggleEvent: vi.fn(),
  save: vi.fn(),
  refresh: vi.fn(),
  matches: vi.fn(),
  ...overrides,
});

vi.mock("../../context", () => ({
  useUTMifyContext: () => mockContext,
}));

let mockContext: UTMifyContextValue;

// ============================================
// TESTS: RENDERING - NEW TOKEN
// ============================================

describe("TokenInput - Rendering (New Token)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext();
  });

  it("should render label", () => {
    render(<TokenInput />);
    expect(screen.getByText("API Token")).toBeInTheDocument();
  });

  it("should render input field", () => {
    render(<TokenInput />);
    const input = screen.getByPlaceholderText("Cole seu token da API da UTMify");
    expect(input).toBeInTheDocument();
  });

  it("should have password type", () => {
    render(<TokenInput />);
    const input = screen.getByPlaceholderText("Cole seu token da API da UTMify");
    expect(input).toHaveAttribute("type", "password");
  });

  it("should have correct id", () => {
    render(<TokenInput />);
    const input = screen.getByPlaceholderText("Cole seu token da API da UTMify");
    expect(input).toHaveAttribute("id", "utmify-token");
  });

  it("should not show existing token hint", () => {
    render(<TokenInput />);
    expect(screen.queryByText("(já configurado)")).not.toBeInTheDocument();
  });

  it("should not show keep current hint", () => {
    render(<TokenInput />);
    expect(screen.queryByText(/Token já salvo de forma segura/)).not.toBeInTheDocument();
  });
});

// ============================================
// TESTS: RENDERING - EXISTING TOKEN
// ============================================

describe("TokenInput - Rendering (Existing Token)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext({ hasExistingToken: true });
  });

  it("should show existing token indicator in label", () => {
    render(<TokenInput />);
    expect(screen.getByText("(já configurado)")).toBeInTheDocument();
  });

  it("should show masked placeholder", () => {
    render(<TokenInput />);
    const input = screen.getByPlaceholderText("••••••••••••••••");
    expect(input).toBeInTheDocument();
  });

  it("should show keep current hint", () => {
    render(<TokenInput />);
    expect(screen.getByText(/Token já salvo de forma segura/)).toBeInTheDocument();
  });

  it("should show replace instruction", () => {
    render(<TokenInput />);
    expect(screen.getByText(/digite um novo para substituir/)).toBeInTheDocument();
  });
});

// ============================================
// TESTS: TOKEN VALUE DISPLAY
// ============================================

describe("TokenInput - Token Value", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display empty token", () => {
    mockContext = createMockContext({ token: "" });
    render(<TokenInput />);
    const input = screen.getByPlaceholderText("Cole seu token da API da UTMify") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("should display current token value", () => {
    mockContext = createMockContext({ token: "abc123xyz" });
    render(<TokenInput />);
    const input = screen.getByPlaceholderText("Cole seu token da API da UTMify") as HTMLInputElement;
    expect(input.value).toBe("abc123xyz");
  });

  it("should display long token", () => {
    const longToken = "a".repeat(100);
    mockContext = createMockContext({ token: longToken });
    render(<TokenInput />);
    const input = screen.getByPlaceholderText("Cole seu token da API da UTMify") as HTMLInputElement;
    expect(input.value).toBe(longToken);
  });
});

// ============================================
// TESTS: INTERACTIONS
// ============================================

describe("TokenInput - Interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockContext();
  });

  it("should call updateToken when typing", () => {
    render(<TokenInput />);
    const input = screen.getByPlaceholderText("Cole seu token da API da UTMify");
    
    fireEvent.change(input, { target: { value: "new-token" } });
    
    expect(mockUpdateToken).toHaveBeenCalledWith("new-token");
  });

  it("should call updateToken with empty string", () => {
    render(<TokenInput />);
    const input = screen.getByPlaceholderText("Cole seu token da API da UTMify");
    
    fireEvent.change(input, { target: { value: "" } });
    
    expect(mockUpdateToken).toHaveBeenCalledWith("");
  });

  it("should call updateToken multiple times", () => {
    render(<TokenInput />);
    const input = screen.getByPlaceholderText("Cole seu token da API da UTMify");
    
    fireEvent.change(input, { target: { value: "a" } });
    fireEvent.change(input, { target: { value: "ab" } });
    fireEvent.change(input, { target: { value: "abc" } });
    
    expect(mockUpdateToken).toHaveBeenCalledTimes(3);
  });

  it("should handle special characters", () => {
    render(<TokenInput />);
    const input = screen.getByPlaceholderText("Cole seu token da API da UTMify");
    
    fireEvent.change(input, { target: { value: "!@#$%^&*()" } });
    
    expect(mockUpdateToken).toHaveBeenCalledWith("!@#$%^&*()");
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("TokenInput - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle existing token with empty value", () => {
    mockContext = createMockContext({ 
      hasExistingToken: true, 
      token: "" 
    });
    render(<TokenInput />);
    
    const input = screen.getByPlaceholderText("••••••••••••••••") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("should handle existing token with new value", () => {
    mockContext = createMockContext({ 
      hasExistingToken: true, 
      token: "new-replacement-token" 
    });
    render(<TokenInput />);
    
    const input = screen.getByPlaceholderText("••••••••••••••••") as HTMLInputElement;
    expect(input.value).toBe("new-replacement-token");
  });

  it("should handle very long token input", () => {
    mockContext = createMockContext();
    render(<TokenInput />);
    const input = screen.getByPlaceholderText("Cole seu token da API da UTMify");
    
    const veryLongToken = "x".repeat(500);
    fireEvent.change(input, { target: { value: veryLongToken } });
    
    expect(mockUpdateToken).toHaveBeenCalledWith(veryLongToken);
  });
});
