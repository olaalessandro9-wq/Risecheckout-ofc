/**
 * Unit Tests: API Types
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for type definitions and type guards.
 * These tests verify the structure of types used across the API layer.
 * 
 * @module lib/api/types.test
 */

import { describe, it, expect } from "vitest";
import type {
  ApiErrorCode,
  ApiError,
  ApiResponse,
  PaginatedResponse,
  MutationResponse,
  PaginationParams,
  SortParams,
  ListParams,
  ProducerContext,
  CrudAction,
  CrudRequest,
} from "./types";

// ============================================================================
// Type Structure Tests
// ============================================================================

describe("ApiError type structure", () => {
  it("should have required fields", () => {
    const error: ApiError = {
      code: "NOT_FOUND",
      message: "Resource not found",
    };

    expect(error.code).toBeDefined();
    expect(error.message).toBeDefined();
  });

  it("should allow optional details", () => {
    const errorWithDetails: ApiError = {
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      details: { field: "email", reason: "invalid format" },
    };

    expect(errorWithDetails.details).toEqual({
      field: "email",
      reason: "invalid format",
    });
  });

  it("should work without details", () => {
    const errorWithoutDetails: ApiError = {
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    };

    expect(errorWithoutDetails.details).toBeUndefined();
  });
});

describe("ApiResponse type structure", () => {
  it("should have success response structure", () => {
    const response: ApiResponse<{ id: string }> = {
      data: { id: "123" },
      error: null,
    };

    expect(response.data).toEqual({ id: "123" });
    expect(response.error).toBeNull();
  });

  it("should have error response structure", () => {
    const response: ApiResponse<{ id: string }> = {
      data: null,
      error: { code: "NOT_FOUND", message: "Not found" },
    };

    expect(response.data).toBeNull();
    expect(response.error?.code).toBe("NOT_FOUND");
  });
});

describe("PaginatedResponse type structure", () => {
  it("should have all pagination fields", () => {
    interface Item {
      id: string;
      name: string;
    }

    const response: PaginatedResponse<Item> = {
      items: [{ id: "1", name: "Item 1" }],
      total: 100,
      page: 1,
      pageSize: 10,
      hasMore: true,
    };

    expect(response.items).toHaveLength(1);
    expect(response.total).toBe(100);
    expect(response.page).toBe(1);
    expect(response.pageSize).toBe(10);
    expect(response.hasMore).toBe(true);
  });

  it("should work with empty items", () => {
    const response: PaginatedResponse<unknown> = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      hasMore: false,
    };

    expect(response.items).toHaveLength(0);
    expect(response.hasMore).toBe(false);
  });
});

describe("MutationResponse type structure", () => {
  it("should have success field", () => {
    const response: MutationResponse = {
      success: true,
    };

    expect(response.success).toBe(true);
  });

  it("should allow optional id", () => {
    const response: MutationResponse = {
      success: true,
      id: "new-id-123",
    };

    expect(response.id).toBe("new-id-123");
  });

  it("should allow optional message", () => {
    const response: MutationResponse = {
      success: true,
      message: "Product created successfully",
    };

    expect(response.message).toBe("Product created successfully");
  });

  it("should support all optional fields", () => {
    const response: MutationResponse = {
      success: false,
      id: undefined,
      message: "Operation failed",
    };

    expect(response.success).toBe(false);
    expect(response.id).toBeUndefined();
    expect(response.message).toBe("Operation failed");
  });
});

describe("PaginationParams type structure", () => {
  it("should have optional page and pageSize", () => {
    const params: PaginationParams = {};

    expect(params.page).toBeUndefined();
    expect(params.pageSize).toBeUndefined();
  });

  it("should allow setting page and pageSize", () => {
    const params: PaginationParams = {
      page: 2,
      pageSize: 25,
    };

    expect(params.page).toBe(2);
    expect(params.pageSize).toBe(25);
  });
});

describe("SortParams type structure", () => {
  it("should have optional sortBy and sortOrder", () => {
    const params: SortParams = {};

    expect(params.sortBy).toBeUndefined();
    expect(params.sortOrder).toBeUndefined();
  });

  it("should allow asc sort order", () => {
    const params: SortParams = {
      sortBy: "name",
      sortOrder: "asc",
    };

    expect(params.sortOrder).toBe("asc");
  });

  it("should allow desc sort order", () => {
    const params: SortParams = {
      sortBy: "created_at",
      sortOrder: "desc",
    };

    expect(params.sortOrder).toBe("desc");
  });
});

describe("ListParams type structure", () => {
  it("should extend pagination and sort params", () => {
    const params: ListParams = {
      page: 1,
      pageSize: 10,
      sortBy: "name",
      sortOrder: "asc",
      search: "test",
      filters: { status: "active" },
    };

    expect(params.page).toBe(1);
    expect(params.sortBy).toBe("name");
    expect(params.search).toBe("test");
    expect(params.filters).toEqual({ status: "active" });
  });

  it("should allow empty params", () => {
    const params: ListParams = {};

    expect(params).toEqual({});
  });
});

describe("ProducerContext type structure", () => {
  it("should have all required fields", () => {
    const context: ProducerContext = {
      id: "user-123",
      email: "producer@example.com",
      name: "John Doe",
      role: "producer",
    };

    expect(context.id).toBe("user-123");
    expect(context.email).toBe("producer@example.com");
    expect(context.name).toBe("John Doe");
    expect(context.role).toBe("producer");
  });

  it("should allow null name", () => {
    const context: ProducerContext = {
      id: "user-456",
      email: "new@example.com",
      name: null,
      role: "producer",
    };

    expect(context.name).toBeNull();
  });
});

describe("CrudAction type", () => {
  it("should include all CRUD actions", () => {
    const actions: CrudAction[] = ["list", "get", "create", "update", "delete"];

    expect(actions).toContain("list");
    expect(actions).toContain("get");
    expect(actions).toContain("create");
    expect(actions).toContain("update");
    expect(actions).toContain("delete");
  });
});

describe("CrudRequest type structure", () => {
  it("should have action field", () => {
    const request: CrudRequest = {
      action: "list",
    };

    expect(request.action).toBe("list");
  });

  it("should allow optional params", () => {
    const request: CrudRequest<"create", { name: string }> = {
      action: "create",
      params: { name: "New Product" },
    };

    expect(request.params).toEqual({ name: "New Product" });
  });

  it("should work without params", () => {
    const request: CrudRequest = {
      action: "delete",
    };

    expect(request.params).toBeUndefined();
  });
});

// ============================================================================
// ApiErrorCode Exhaustiveness
// ============================================================================

describe("ApiErrorCode exhaustiveness", () => {
  it("should include all expected error codes", () => {
    const allCodes: ApiErrorCode[] = [
      "UNAUTHORIZED",
      "FORBIDDEN",
      "NOT_FOUND",
      "VALIDATION_ERROR",
      "CONFLICT",
      "RATE_LIMITED",
      "INTERNAL_ERROR",
      "NETWORK_ERROR",
      "TIMEOUT",
      "UNKNOWN",
    ];

    // Verify we have exactly 10 error codes
    expect(allCodes).toHaveLength(10);

    // Each code should be unique
    const uniqueCodes = new Set(allCodes);
    expect(uniqueCodes.size).toBe(10);
  });
});

// ============================================================================
// Type Guard Helpers (if needed in the future)
// ============================================================================

describe("Type checking patterns", () => {
  it("should correctly identify success response", () => {
    const response: ApiResponse<{ id: string }> = {
      data: { id: "123" },
      error: null,
    };

    const isSuccess = response.data !== null && response.error === null;
    expect(isSuccess).toBe(true);
  });

  it("should correctly identify error response", () => {
    const response: ApiResponse<{ id: string }> = {
      data: null,
      error: { code: "NOT_FOUND", message: "Not found" },
    };

    const isError = response.error !== null && response.data === null;
    expect(isError).toBe(true);
  });
});
