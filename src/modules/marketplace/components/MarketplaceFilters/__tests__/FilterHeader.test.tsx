/**
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * FilterHeader - Testes Unitários
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FilterHeader } from "../FilterHeader";

describe("FilterHeader", () => {
  it("should render title", () => {
    render(<FilterHeader activeFiltersCount={0} />);
    expect(screen.getByText("Filtrar")).toBeInTheDocument();
  });

  it("should render icon", () => {
    const { container } = render(<FilterHeader activeFiltersCount={0} />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it("should not show count when zero filters", () => {
    render(<FilterHeader activeFiltersCount={0} />);
    expect(screen.queryByText(/ativo/)).not.toBeInTheDocument();
  });

  it("should show singular count", () => {
    render(<FilterHeader activeFiltersCount={1} />);
    expect(screen.getByText("1 ativo")).toBeInTheDocument();
  });

  it("should show plural count", () => {
    render(<FilterHeader activeFiltersCount={3} />);
    expect(screen.getByText("3 ativos")).toBeInTheDocument();
  });

  it("should have border bottom", () => {
    const { container } = render(<FilterHeader activeFiltersCount={0} />);
    const header = container.querySelector('.border-b');
    expect(header).toBeInTheDocument();
  });
});
