/**
 * @file BusyProvider.ui.test.tsx
 * @description UI tests for BusyProvider (Icons, Descriptions)
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@/test/utils";
import { BusyProvider, useBusy } from "../BusyProvider";
import { renderHook, act } from "@testing-library/react";

// ============================================================================
// MOCKS
// ============================================================================

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Loader2: ({ className }: { className?: string }) => <div data-testid="loader-icon" className={className}>Loader2</div>,
  Copy: ({ className }: { className?: string }) => <div data-testid="copy-icon" className={className}>Copy</div>,
  Trash2: ({ className }: { className?: string }) => <div data-testid="trash-icon" className={className}>Trash2</div>,
  Save: ({ className }: { className?: string }) => <div data-testid="save-icon" className={className}>Save</div>,
  Upload: ({ className }: { className?: string }) => <div data-testid="upload-icon" className={className}>Upload</div>,
  Download: ({ className }: { className?: string }) => <div data-testid="download-icon" className={className}>Download</div>,
}));

// ============================================================================
// TESTS
// ============================================================================

describe("BusyProvider - UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // ICONS
  // ==========================================================================
  describe("Icons", () => {
    it("should render default loader icon for generic messages", () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      act(() => { result.current.show("Generic message"); });
      expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    });
    it("should render copy icon for duplication messages", () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      act(() => { result.current.show("Duplicando produto..."); });
      expect(screen.getByTestId("copy-icon")).toBeInTheDocument();
    });
    it("should render trash icon for deletion messages", () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      act(() => { result.current.show("Excluindo item..."); });
      expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
    });
    it("should render save icon for saving messages", () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      act(() => { result.current.show("Salvando alterações..."); });
      expect(screen.getByTestId("save-icon")).toBeInTheDocument();
    });
    it("should render upload icon for upload messages", () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      act(() => { result.current.show("Enviando arquivo..."); });
      expect(screen.getByTestId("upload-icon")).toBeInTheDocument();
    });
    it("should render download icon for download messages", () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      act(() => { result.current.show("Baixando arquivo..."); });
      expect(screen.getByTestId("download-icon")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // DESCRIPTIONS
  // ==========================================================================
  describe("Descriptions", () => {
    it("should render default description for generic messages", () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      act(() => { result.current.show("Generic"); });
      expect(screen.getByText(/Aguarde enquanto processamos/)).toBeInTheDocument();
    });
    it("should render specific description for duplication", () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      act(() => { result.current.show("Duplicando produto"); });
      expect(screen.getByText(/Criando uma cópia completa do produto/)).toBeInTheDocument();
    });
    it("should render specific description for deletion", () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      act(() => { result.current.show("Excluindo produto"); });
      expect(screen.getByText(/Removendo o produto e desativando todos os checkouts/)).toBeInTheDocument();
    });
    it("should render specific description for saving", () => {
      const { result } = renderHook(() => useBusy(), { wrapper: BusyProvider });
      act(() => { result.current.show("Salvando dados"); });
      expect(screen.getByText(/Salvando suas alterações no banco de dados/)).toBeInTheDocument();
    });
  });
});
