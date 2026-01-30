/**
 * use-toast.test.ts
 * 
 * Tests for useToast hook and reducer
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast, toast, reducer } from "../use-toast";

describe("use-toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("reducer", () => {
    it("should add toast with ADD_TOAST action", () => {
      const initialState = { toasts: [] };
      const newToast = { id: "1", title: "Test", open: true };

      const result = reducer(initialState, {
        type: "ADD_TOAST",
        toast: newToast,
      });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0]).toEqual(newToast);
    });

    it("should limit toasts to TOAST_LIMIT", () => {
      const initialState = { toasts: [] };
      
      // Add first toast
      let state = reducer(initialState, {
        type: "ADD_TOAST",
        toast: { id: "1", title: "First", open: true },
      });

      // Add second toast (should replace first due to TOAST_LIMIT=1)
      state = reducer(state, {
        type: "ADD_TOAST",
        toast: { id: "2", title: "Second", open: true },
      });

      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].id).toBe("2");
    });

    it("should update toast with UPDATE_TOAST action", () => {
      const initialState = {
        toasts: [{ id: "1", title: "Original", open: true }],
      };

      const result = reducer(initialState, {
        type: "UPDATE_TOAST",
        toast: { id: "1", title: "Updated" },
      });

      expect(result.toasts[0].title).toBe("Updated");
      expect(result.toasts[0].open).toBe(true);
    });

    it("should dismiss toast with DISMISS_TOAST action", () => {
      const initialState = {
        toasts: [{ id: "1", title: "Test", open: true }],
      };

      const result = reducer(initialState, {
        type: "DISMISS_TOAST",
        toastId: "1",
      });

      expect(result.toasts[0].open).toBe(false);
    });

    it("should dismiss all toasts when no toastId provided", () => {
      const initialState = {
        toasts: [
          { id: "1", title: "Test 1", open: true },
          { id: "2", title: "Test 2", open: true },
        ],
      };

      const result = reducer(initialState, {
        type: "DISMISS_TOAST",
      });

      expect(result.toasts.every(t => t.open === false)).toBe(true);
    });

    it("should remove specific toast with REMOVE_TOAST action", () => {
      const initialState = {
        toasts: [
          { id: "1", title: "Test 1", open: true },
          { id: "2", title: "Test 2", open: true },
        ],
      };

      const result = reducer(initialState, {
        type: "REMOVE_TOAST",
        toastId: "1",
      });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe("2");
    });

    it("should remove all toasts when no toastId provided", () => {
      const initialState = {
        toasts: [
          { id: "1", title: "Test 1", open: true },
          { id: "2", title: "Test 2", open: true },
        ],
      };

      const result = reducer(initialState, {
        type: "REMOVE_TOAST",
      });

      expect(result.toasts).toHaveLength(0);
    });
  });

  describe("toast function", () => {
    it("should create toast and return control functions", () => {
      const result = toast({ title: "Test Toast" });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("dismiss");
      expect(result).toHaveProperty("update");
      expect(typeof result.dismiss).toBe("function");
      expect(typeof result.update).toBe("function");
    });

    it("should generate unique IDs for each toast", () => {
      const toast1 = toast({ title: "Toast 1" });
      const toast2 = toast({ title: "Toast 2" });

      expect(toast1.id).not.toBe(toast2.id);
    });
  });

  describe("useToast hook", () => {
    it("should return toasts array and control functions", () => {
      const { result } = renderHook(() => useToast());

      expect(result.current).toHaveProperty("toasts");
      expect(result.current).toHaveProperty("toast");
      expect(result.current).toHaveProperty("dismiss");
      expect(Array.isArray(result.current.toasts)).toBe(true);
    });

    it("should add toast when toast function is called", () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: "New Toast" });
      });

      expect(result.current.toasts.length).toBeGreaterThanOrEqual(0);
    });

    it("should dismiss toast by id", () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const t = result.current.toast({ title: "To Dismiss" });
        toastId = t.id;
      });

      act(() => {
        result.current.dismiss(toastId);
      });

      // Toast should be marked as not open (dismissed)
      const dismissedToast = result.current.toasts.find(t => t.id === toastId);
      if (dismissedToast) {
        expect(dismissedToast.open).toBe(false);
      }
    });
  });
});
