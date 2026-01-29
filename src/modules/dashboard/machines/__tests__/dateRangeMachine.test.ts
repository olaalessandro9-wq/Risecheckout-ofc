/**
 * DateRangeMachine Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the DateRange State Machine.
 * Covers states, transitions, guards, and actions.
 * 
 * @module dashboard/machines/__tests__
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createActor } from "xstate";
import { dateRangeMachine } from "../dateRangeMachine";
import { createInitialDateRangeContext } from "../dateRangeMachine.types";
import {
  canApplyRange,
  hasSavedRange,
  hasRangeError,
  hasBothDates,
} from "../dateRangeMachine.guards";

// ============================================================================
// GUARD TESTS
// ============================================================================

describe("dateRangeMachine guards", () => {
  describe("canApplyRange", () => {
    it("returns true when both dates are defined and no error", () => {
      const context = {
        ...createInitialDateRangeContext(),
        leftDate: new Date("2024-01-01"),
        rightDate: new Date("2024-01-31"),
        hasError: false,
      };
      expect(canApplyRange(context)).toBe(true);
    });

    it("returns false when leftDate is undefined", () => {
      const context = {
        ...createInitialDateRangeContext(),
        leftDate: undefined,
        rightDate: new Date("2024-01-31"),
        hasError: false,
      };
      expect(canApplyRange(context)).toBe(false);
    });

    it("returns false when rightDate is undefined", () => {
      const context = {
        ...createInitialDateRangeContext(),
        leftDate: new Date("2024-01-01"),
        rightDate: undefined,
        hasError: false,
      };
      expect(canApplyRange(context)).toBe(false);
    });

    it("returns false when hasError is true", () => {
      const context = {
        ...createInitialDateRangeContext(),
        leftDate: new Date("2024-01-01"),
        rightDate: new Date("2024-01-31"),
        hasError: true,
      };
      expect(canApplyRange(context)).toBe(false);
    });
  });

  describe("hasSavedRange", () => {
    it("returns true when savedRange is defined", () => {
      const context = {
        ...createInitialDateRangeContext(),
        savedRange: { from: new Date("2024-01-01"), to: new Date("2024-01-31") },
      };
      expect(hasSavedRange(context)).toBe(true);
    });

    it("returns false when savedRange is undefined", () => {
      const context = createInitialDateRangeContext();
      expect(hasSavedRange(context)).toBe(false);
    });
  });

  describe("hasRangeError", () => {
    it("returns true when hasError is true", () => {
      const context = { ...createInitialDateRangeContext(), hasError: true };
      expect(hasRangeError(context)).toBe(true);
    });

    it("returns false when hasError is false", () => {
      const context = { ...createInitialDateRangeContext(), hasError: false };
      expect(hasRangeError(context)).toBe(false);
    });
  });

  describe("hasBothDates", () => {
    it("returns true when both dates are defined", () => {
      const context = {
        ...createInitialDateRangeContext(),
        leftDate: new Date("2024-01-01"),
        rightDate: new Date("2024-01-31"),
      };
      expect(hasBothDates(context)).toBe(true);
    });

    it("returns false when leftDate is undefined", () => {
      const context = {
        ...createInitialDateRangeContext(),
        leftDate: undefined,
        rightDate: new Date("2024-01-31"),
      };
      expect(hasBothDates(context)).toBe(false);
    });
  });
});

// ============================================================================
// STATE MACHINE TESTS
// ============================================================================

describe("dateRangeMachine", () => {
  let actor: ReturnType<typeof createActor<typeof dateRangeMachine>>;

  beforeEach(() => {
    actor = createActor(dateRangeMachine);
    actor.start();
  });

  describe("initial state", () => {
    it("starts in idle state", () => {
      const snapshot = actor.getSnapshot();
      expect(snapshot.matches("idle")).toBe(true);
    });

    it("has correct initial context", () => {
      const { context } = actor.getSnapshot();
      expect(context.preset).toBe("30days");
      expect(context.leftDate).toBeUndefined();
      expect(context.rightDate).toBeUndefined();
      expect(context.savedRange).toBeUndefined();
      expect(context.hasError).toBe(false);
    });
  });

  describe("idle state transitions", () => {
    it("transitions to dropdownOpen on OPEN_DROPDOWN", () => {
      actor.send({ type: "OPEN_DROPDOWN" });
      expect(actor.getSnapshot().matches("dropdownOpen")).toBe(true);
    });

    it("transitions to calendarOpen on OPEN_CALENDAR", () => {
      actor.send({ type: "OPEN_CALENDAR" });
      expect(actor.getSnapshot().matches("calendarOpen")).toBe(true);
    });

    it("updates preset on SELECT_PRESET", () => {
      actor.send({ type: "SELECT_PRESET", preset: "7days" });
      expect(actor.getSnapshot().context.preset).toBe("7days");
      expect(actor.getSnapshot().matches("idle")).toBe(true);
    });
  });

  describe("dropdownOpen state transitions", () => {
    beforeEach(() => {
      actor.send({ type: "OPEN_DROPDOWN" });
    });

    it("transitions to idle on CLOSE_DROPDOWN", () => {
      actor.send({ type: "CLOSE_DROPDOWN" });
      expect(actor.getSnapshot().matches("idle")).toBe(true);
    });

    it("transitions to idle and updates preset on SELECT_PRESET", () => {
      actor.send({ type: "SELECT_PRESET", preset: "7days" });
      expect(actor.getSnapshot().context.preset).toBe("7days");
      expect(actor.getSnapshot().matches("idle")).toBe(true);
    });

    it("transitions to calendarOpen on OPEN_CALENDAR", () => {
      actor.send({ type: "OPEN_CALENDAR" });
      expect(actor.getSnapshot().matches("calendarOpen")).toBe(true);
    });
  });

  describe("calendarOpen state transitions", () => {
    beforeEach(() => {
      actor.send({ type: "OPEN_CALENDAR" });
    });

    it("transitions to idle on CLOSE_CALENDAR", () => {
      actor.send({ type: "CLOSE_CALENDAR" });
      expect(actor.getSnapshot().matches("idle")).toBe(true);
    });

    it("transitions to idle and clears dates on CANCEL", () => {
      const leftDate = new Date("2024-01-01");
      actor.send({ type: "SET_LEFT_DATE", date: leftDate });
      actor.send({ type: "CANCEL" });
      expect(actor.getSnapshot().matches("idle")).toBe(true);
      expect(actor.getSnapshot().context.leftDate).toBeUndefined();
    });

    it("updates leftDate on SET_LEFT_DATE", () => {
      const date = new Date("2024-01-01");
      actor.send({ type: "SET_LEFT_DATE", date });
      expect(actor.getSnapshot().context.leftDate).toEqual(date);
    });

    it("updates rightDate on SET_RIGHT_DATE", () => {
      const date = new Date("2024-01-31");
      actor.send({ type: "SET_RIGHT_DATE", date });
      expect(actor.getSnapshot().context.rightDate).toEqual(date);
    });

    it("detects error when rightDate <= leftDate", () => {
      actor.send({ type: "SET_LEFT_DATE", date: new Date("2024-01-31") });
      actor.send({ type: "SET_RIGHT_DATE", date: new Date("2024-01-01") });
      expect(actor.getSnapshot().context.hasError).toBe(true);
    });

    it("applies custom range when valid", () => {
      actor.send({ type: "SET_LEFT_DATE", date: new Date("2024-01-01") });
      actor.send({ type: "SET_RIGHT_DATE", date: new Date("2024-01-31") });
      actor.send({ type: "APPLY_CUSTOM_RANGE" });
      
      const snapshot = actor.getSnapshot();
      expect(snapshot.matches("idle")).toBe(true);
      expect(snapshot.context.preset).toBe("custom");
      expect(snapshot.context.savedRange).toBeDefined();
    });

    it("does not apply range when guard fails", () => {
      // No dates set - guard should fail
      actor.send({ type: "APPLY_CUSTOM_RANGE" });
      expect(actor.getSnapshot().matches("calendarOpen")).toBe(true);
    });
  });

  describe("RESTORE_SAVED event", () => {
    it("restores saved range when available", () => {
      // First, save a custom range
      actor.send({ type: "OPEN_CALENDAR" });
      actor.send({ type: "SET_LEFT_DATE", date: new Date("2024-01-01") });
      actor.send({ type: "SET_RIGHT_DATE", date: new Date("2024-01-31") });
      actor.send({ type: "APPLY_CUSTOM_RANGE" });
      
      // Clear dates
      actor.send({ type: "OPEN_CALENDAR" });
      actor.send({ type: "CANCEL" });
      
      // Restore
      actor.send({ type: "OPEN_CALENDAR" });
      actor.send({ type: "RESTORE_SAVED" });
      
      const { context } = actor.getSnapshot();
      expect(context.leftDate).toEqual(new Date("2024-01-01"));
      expect(context.rightDate).toEqual(new Date("2024-01-31"));
    });
  });
});
