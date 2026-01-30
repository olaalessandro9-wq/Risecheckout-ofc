/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * SearchFilter - Testes Unitários
 * 
 * Testa o componente de filtro de busca por texto.
 * Cobre renderização, digitação, clear button, e submit.
 * 
 * @version 1.0.0
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchFilter } from "../SearchFilter";

// ============================================
// MOCKS
// ============================================

const mockSetSearchInput = vi.fn();
const mockOnSearch = vi.fn();
const mockOnClearSearch = vi.fn();

// ============================================
// TESTS: RENDERING
// ============================================

describe("SearchFilter - Rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render label", () => {
    render(
      <SearchFilter
        searchInput=""
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    expect(screen.getByText("Nome do produtor ou do produto")).toBeInTheDocument();
  });

  it("should render input field", () => {
    render(
      <SearchFilter
        searchInput=""
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const input = screen.getByPlaceholderText("Insira...");
    expect(input).toBeInTheDocument();
  });

  it("should render search icon", () => {
    const { container } = render(
      <SearchFilter
        searchInput=""
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const searchIcon = container.querySelector('.absolute.left-3');
    expect(searchIcon).toBeInTheDocument();
  });

  it("should have correct input id", () => {
    render(
      <SearchFilter
        searchInput=""
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const input = screen.getByPlaceholderText("Insira...");
    expect(input).toHaveAttribute("id", "search");
  });
});

// ============================================
// TESTS: INPUT VALUE
// ============================================

describe("SearchFilter - Input Value", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display empty input", () => {
    render(
      <SearchFilter
        searchInput=""
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const input = screen.getByPlaceholderText("Insira...") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("should display current search value", () => {
    render(
      <SearchFilter
        searchInput="test query"
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const input = screen.getByPlaceholderText("Insira...") as HTMLInputElement;
    expect(input.value).toBe("test query");
  });

  it("should display long search value", () => {
    const longQuery = "a".repeat(100);
    render(
      <SearchFilter
        searchInput={longQuery}
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const input = screen.getByPlaceholderText("Insira...") as HTMLInputElement;
    expect(input.value).toBe(longQuery);
  });
});

// ============================================
// TESTS: TYPING
// ============================================

describe("SearchFilter - Typing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call setSearchInput when typing", () => {
    render(
      <SearchFilter
        searchInput=""
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const input = screen.getByPlaceholderText("Insira...");
    
    fireEvent.change(input, { target: { value: "new query" } });
    
    expect(mockSetSearchInput).toHaveBeenCalledWith("new query");
  });

  it("should call setSearchInput with empty string", () => {
    render(
      <SearchFilter
        searchInput="test"
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const input = screen.getByPlaceholderText("Insira...");
    
    fireEvent.change(input, { target: { value: "" } });
    
    expect(mockSetSearchInput).toHaveBeenCalledWith("");
  });

  it("should handle special characters", () => {
    render(
      <SearchFilter
        searchInput=""
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const input = screen.getByPlaceholderText("Insira...");
    
    fireEvent.change(input, { target: { value: "test@#$%" } });
    
    expect(mockSetSearchInput).toHaveBeenCalledWith("test@#$%");
  });
});

// ============================================
// TESTS: ENTER KEY
// ============================================

describe("SearchFilter - Enter Key", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call onSearch when Enter is pressed", () => {
    render(
      <SearchFilter
        searchInput="test"
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const input = screen.getByPlaceholderText("Insira...");
    
    fireEvent.keyDown(input, { key: "Enter" });
    
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
  });

  it("should not call onSearch for other keys", () => {
    render(
      <SearchFilter
        searchInput="test"
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const input = screen.getByPlaceholderText("Insira...");
    
    fireEvent.keyDown(input, { key: "a" });
    
    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it("should call onSearch even with empty input", () => {
    render(
      <SearchFilter
        searchInput=""
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const input = screen.getByPlaceholderText("Insira...");
    
    fireEvent.keyDown(input, { key: "Enter" });
    
    expect(mockOnSearch).toHaveBeenCalledTimes(1);
  });
});

// ============================================
// TESTS: CLEAR BUTTON
// ============================================

describe("SearchFilter - Clear Button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show clear button when has input", () => {
    const { container } = render(
      <SearchFilter
        searchInput="test"
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const clearButton = container.querySelector('.absolute.right-3');
    expect(clearButton).toBeInTheDocument();
  });

  it("should not show clear button when input is empty", () => {
    const { container } = render(
      <SearchFilter
        searchInput=""
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const clearButton = container.querySelector('.absolute.right-3');
    expect(clearButton).not.toBeInTheDocument();
  });

  it("should call onClearSearch when clear button clicked", () => {
    const { container } = render(
      <SearchFilter
        searchInput="test"
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const clearButton = container.querySelector('.absolute.right-3') as HTMLButtonElement;
    
    fireEvent.click(clearButton);
    
    expect(mockOnClearSearch).toHaveBeenCalledTimes(1);
  });

  it("should have X icon in clear button", () => {
    const { container } = render(
      <SearchFilter
        searchInput="test"
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const clearButton = container.querySelector('.absolute.right-3');
    const xIcon = clearButton?.querySelector('svg');
    expect(xIcon).toBeInTheDocument();
  });
});

// ============================================
// TESTS: STYLING
// ============================================

describe("SearchFilter - Styling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have padding for search icon", () => {
    render(
      <SearchFilter
        searchInput=""
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const input = screen.getByPlaceholderText("Insira...");
    expect(input).toHaveClass("pl-9");
  });

  it("should have correct height", () => {
    render(
      <SearchFilter
        searchInput=""
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const input = screen.getByPlaceholderText("Insira...");
    expect(input).toHaveClass("h-9");
  });

  it("should have small text size", () => {
    render(
      <SearchFilter
        searchInput=""
        setSearchInput={mockSetSearchInput}
        onSearch={mockOnSearch}
        onClearSearch={mockOnClearSearch}
      />
    );
    const input = screen.getByPlaceholderText("Insira...");
    expect(input).toHaveClass("text-sm");
  });
});
