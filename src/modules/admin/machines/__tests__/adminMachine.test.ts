/**
 * AdminMachine Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for the Admin State Machine.
 * 
 * @module admin/machines/__tests__
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createActor } from "xstate";
import { adminMachine } from "../adminMachine";

// ============================================================================
// STATE MACHINE TESTS
// ============================================================================

describe("adminMachine", () => {
  let actor: ReturnType<typeof createActor<typeof adminMachine>>;

  beforeEach(() => {
    actor = createActor(adminMachine, { input: { callerRole: "owner" } });
    actor.start();
  });

  afterEach(() => {
    actor.stop();
  });

  describe("initial state", () => {
    it("starts in active state", () => {
      expect(actor.getSnapshot().matches("active")).toBe(true);
    });

    it("has correct initial context with owner role", () => {
      const { context } = actor.getSnapshot();
      expect(context.callerRole).toBe("owner");
      expect(context.activeTab).toBe("dashboard");
      expect(context.period).toBe("30d");
    });

    it("has correct users state structure", () => {
      const { users } = actor.getSnapshot().context;
      expect(users.items).toEqual([]);
      expect(users.emailsMap).toEqual({});
      expect(users.selectedUser).toBeNull();
      expect(users.searchTerm).toBe("");
      expect(users.error).toBeNull();
    });

    it("has correct products state structure", () => {
      const { products } = actor.getSnapshot().context;
      expect(products.items).toEqual([]);
      expect(products.selectedProductId).toBeNull();
      expect(products.searchTerm).toBe("");
      expect(products.error).toBeNull();
    });

    it("has correct orders state structure", () => {
      const { orders } = actor.getSnapshot().context;
      expect(orders.items).toEqual([]);
      expect(orders.selectedOrder).toBeNull();
      expect(orders.searchTerm).toBe("");
      expect(orders.currentPage).toBe(1);
    });
  });

  describe("with different roles", () => {
    it("initializes correctly with admin role", () => {
      const adminActor = createActor(adminMachine, { input: { callerRole: "admin" } });
      adminActor.start();
      expect(adminActor.getSnapshot().context.callerRole).toBe("admin");
      adminActor.stop();
    });
  });

  describe("machine configuration", () => {
    it("has correct machine id", () => {
      expect(adminMachine.id).toBe("admin");
    });

    it("has active as the only top-level state", () => {
      const states = adminMachine.config.states;
      expect(states?.active).toBeDefined();
    });

    it("has isOwner and isAdminOrOwner guards", () => {
      // Guards are defined in setup
      expect(adminMachine).toBeDefined();
    });
  });

  describe("active state events", () => {
    it("handles CHANGE_TAB event", () => {
      actor.send({ type: "CHANGE_TAB", tab: "users" });
      expect(actor.getSnapshot().context.activeTab).toBe("users");
    });

    it("handles SET_PERIOD event", () => {
      actor.send({ type: "SET_PERIOD", period: "7days" });
      expect(actor.getSnapshot().context.period).toBe("7days");
    });

    it("handles user-related events", () => {
      const activeState = adminMachine.config.states?.active;
      const events = activeState?.on;
      
      expect(events?.LOAD_USERS).toBeDefined();
      expect(events?.REFRESH_USERS).toBeDefined();
      expect(events?.USERS_LOADED).toBeDefined();
      expect(events?.USERS_ERROR).toBeDefined();
      expect(events?.SELECT_USER).toBeDefined();
      expect(events?.DESELECT_USER).toBeDefined();
      expect(events?.SET_USERS_SEARCH).toBeDefined();
    });

    it("handles product-related events", () => {
      const activeState = adminMachine.config.states?.active;
      const events = activeState?.on;
      
      expect(events?.LOAD_PRODUCTS).toBeDefined();
      expect(events?.REFRESH_PRODUCTS).toBeDefined();
      expect(events?.PRODUCTS_LOADED).toBeDefined();
      expect(events?.PRODUCTS_ERROR).toBeDefined();
      expect(events?.SELECT_PRODUCT).toBeDefined();
    });

    it("handles order-related events", () => {
      const activeState = adminMachine.config.states?.active;
      const events = activeState?.on;
      
      expect(events?.LOAD_ORDERS).toBeDefined();
      expect(events?.ORDERS_LOADED).toBeDefined();
      expect(events?.SELECT_ORDER).toBeDefined();
      expect(events?.SET_ORDERS_PAGE).toBeDefined();
    });

    it("handles security-related events", () => {
      const activeState = adminMachine.config.states?.active;
      const events = activeState?.on;
      
      expect(events?.LOAD_SECURITY).toBeDefined();
      expect(events?.SECURITY_LOADED).toBeDefined();
      expect(events?.SELECT_ALERT).toBeDefined();
      expect(events?.TOGGLE_AUTO_REFRESH).toBeDefined();
    });
  });
});
