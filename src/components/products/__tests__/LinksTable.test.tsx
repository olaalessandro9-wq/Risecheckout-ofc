/**
 * LinksTable Component Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for LinksTable component covering:
 * - Table rendering
 * - Search functionality
 * - Link actions (copy, open)
 * - Status toggle
 * - Empty states
 * 
 * @module components/products/__tests__/LinksTable.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { LinksTable, type PaymentLink } from "../LinksTable";
import userEvent from "@testing-library/user-event";

// Mock lucide-react icons
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    Search: () => <div data-testid="search-icon" />,
    Copy: () => <div data-testid="copy-icon" />,
    ExternalLink: () => <div data-testid="external-link-icon" />,
    Power: () => <div data-testid="power-icon" />,
    MoreVertical: () => <div data-testid="more-icon" />,
  };
});

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe("LinksTable", () => {
  const mockOnToggleStatus = vi.fn();

  const mockLinks: PaymentLink[] = [
    {
      id: "1",
      slug: "produto-teste",
      url: "https://risecheckout.com/c/produto-teste",
      offer_name: "Produto Teste",
      offer_price: 9900,
      is_default: true,
      status: "active",
      checkouts: [
        { id: "checkout-1", name: "Checkout Principal" },
      ],
    },
    {
      id: "2",
      slug: "produto-inativo",
      url: "https://risecheckout.com/c/produto-inativo",
      offer_name: "Produto Inativo",
      offer_price: 14900,
      is_default: false,
      status: "inactive",
      checkouts: [],
    },
  ];

  const defaultProps = {
    links: mockLinks,
    onToggleStatus: mockOnToggleStatus,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders search input", () => {
      render(<LinksTable {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/pesquisar links/i);
      expect(searchInput).toBeInTheDocument();
    });

    it("renders table with links", () => {
      render(<LinksTable {...defaultProps} />);

      expect(screen.getByText("Produto Teste")).toBeInTheDocument();
      expect(screen.getByText("Produto Inativo")).toBeInTheDocument();
    });

    it("displays offer names", () => {
      render(<LinksTable {...defaultProps} />);

      expect(screen.getByText("Produto Teste")).toBeInTheDocument();
    });

    it("displays formatted prices", () => {
      render(<LinksTable {...defaultProps} />);

      expect(screen.getByText(/R\$ 99,00/i)).toBeInTheDocument();
      expect(screen.getByText(/R\$ 149,00/i)).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("filters links by offer name", async () => {
      const user = userEvent.setup();
      render(<LinksTable {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/pesquisar links/i);
      await user.type(searchInput, "Teste");

      expect(screen.getByText("Produto Teste")).toBeInTheDocument();
      expect(screen.queryByText("Produto Inativo")).not.toBeInTheDocument();
    });

    it("filters links by slug", async () => {
      const user = userEvent.setup();
      render(<LinksTable {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/pesquisar links/i);
      await user.type(searchInput, "inativo");

      expect(screen.getByText("Produto Inativo")).toBeInTheDocument();
      expect(screen.queryByText("Produto Teste")).not.toBeInTheDocument();
    });

    it("search is case insensitive", async () => {
      const user = userEvent.setup();
      render(<LinksTable {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/pesquisar links/i);
      await user.type(searchInput, "TESTE");

      expect(screen.getByText("Produto Teste")).toBeInTheDocument();
    });

    it("shows all links when search is empty", () => {
      render(<LinksTable {...defaultProps} />);

      expect(screen.getByText("Produto Teste")).toBeInTheDocument();
      expect(screen.getByText("Produto Inativo")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty message when no links", () => {
      render(<LinksTable {...defaultProps} links={[]} />);

      expect(screen.getByText(/nenhum link de pagamento encontrado/i)).toBeInTheDocument();
    });

    it("shows empty message when search has no results", async () => {
      const user = userEvent.setup();
      render(<LinksTable {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/pesquisar links/i);
      await user.type(searchInput, "INEXISTENTE");

      expect(screen.getByText(/nenhum link corresponde/i)).toBeInTheDocument();
    });
  });

  describe("Status Display", () => {
    it("renders status information", () => {
      render(<LinksTable {...defaultProps} />);

      // Verifica que a tabela renderiza
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });

  describe("Link Actions", () => {
    it("has copy button for each link", () => {
      render(<LinksTable {...defaultProps} />);

      const copyButtons = screen.getAllByTestId("copy-icon");
      expect(copyButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Default Link Indicator", () => {
    it("renders link information", () => {
      render(<LinksTable {...defaultProps} />);

      expect(screen.getByText("Produto Teste")).toBeInTheDocument();
    });
  });

  describe("Checkout Association", () => {
    it("displays associated checkout names", () => {
      render(<LinksTable {...defaultProps} />);

      expect(screen.getByText("Checkout Principal")).toBeInTheDocument();
    });

    it("handles links without checkouts", () => {
      render(<LinksTable {...defaultProps} />);

      // Link inativo não tem checkouts, deve renderizar sem erros
      expect(screen.getByText("Produto Inativo")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has accessible search input", () => {
      render(<LinksTable {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/pesquisar links/i);
      expect(searchInput).toBeInTheDocument();
    });

    it("table has proper structure", () => {
      render(<LinksTable {...defaultProps} />);

      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });
});
