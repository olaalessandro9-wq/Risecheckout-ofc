/**
 * Testing Infrastructure - Mock Supabase Client
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Centralized mock Supabase client replacing 14 local implementations.
 * Provides full QueryBuilder support with type-safe operations.
 * 
 * @module _shared/testing/mock-supabase-client
 * @version 1.0.0
 */

import type {
  MockDataStore,
  MockSupabaseClientConfig,
  MockUser,
  MockSession,
  MockError,
  MockQueryResult,
} from "./types.ts";

// ============================================================================
// MOCK QUERY BUILDER
// ============================================================================

type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "is" | "in";

interface Filter {
  column: string;
  operator: FilterOperator;
  value: unknown;
}

interface QueryState {
  table: string;
  operation: "select" | "insert" | "update" | "upsert" | "delete";
  columns: string;
  filters: Filter[];
  orderBy: { column: string; ascending: boolean } | null;
  limitCount: number | null;
  rangeFrom: number | null;
  rangeTo: number | null;
  insertData: unknown;
  updateData: unknown;
  returnData: boolean;
}

/**
 * Mock QueryBuilder that mimics Supabase's fluent API
 */
class MockQueryBuilder<T = unknown> {
  private state: QueryState;
  private dataStore: MockDataStore;
  private forceError: MockError | null;

  constructor(
    table: string,
    dataStore: MockDataStore,
    forceError: MockError | null = null
  ) {
    this.dataStore = dataStore;
    this.forceError = forceError;
    this.state = {
      table,
      operation: "select",
      columns: "*",
      filters: [],
      orderBy: null,
      limitCount: null,
      rangeFrom: null,
      rangeTo: null,
      insertData: null,
      updateData: null,
      returnData: false,
    };
  }

  // ============================================================================
  // OPERATIONS
  // ============================================================================

  select(columns = "*"): this {
    this.state.operation = "select";
    this.state.columns = columns;
    return this;
  }

  insert(data: unknown): this {
    this.state.operation = "insert";
    this.state.insertData = data;
    return this;
  }

  update(data: unknown): this {
    this.state.operation = "update";
    this.state.updateData = data;
    return this;
  }

  upsert(data: unknown): this {
    this.state.operation = "upsert";
    this.state.insertData = data;
    return this;
  }

  delete(): this {
    this.state.operation = "delete";
    return this;
  }

  // ============================================================================
  // FILTERS
  // ============================================================================

  eq(column: string, value: unknown): this {
    this.state.filters.push({ column, operator: "eq", value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.state.filters.push({ column, operator: "neq", value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.state.filters.push({ column, operator: "gt", value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.state.filters.push({ column, operator: "gte", value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this.state.filters.push({ column, operator: "lt", value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.state.filters.push({ column, operator: "lte", value });
    return this;
  }

  like(column: string, pattern: string): this {
    this.state.filters.push({ column, operator: "like", value: pattern });
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.state.filters.push({ column, operator: "ilike", value: pattern });
    return this;
  }

  is(column: string, value: unknown): this {
    this.state.filters.push({ column, operator: "is", value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.state.filters.push({ column, operator: "in", value: values });
    return this;
  }

  // ============================================================================
  // MODIFIERS
  // ============================================================================

  order(column: string, options?: { ascending?: boolean }): this {
    this.state.orderBy = {
      column,
      ascending: options?.ascending ?? true,
    };
    return this;
  }

  limit(count: number): this {
    this.state.limitCount = count;
    return this;
  }

  range(from: number, to: number): this {
    this.state.rangeFrom = from;
    this.state.rangeTo = to;
    return this;
  }

  // ============================================================================
  // TERMINATORS
  // ============================================================================

  single(): Promise<MockQueryResult<T>> {
    return this.execute().then((result) => {
      if (result.error) return result as MockQueryResult<T>;
      
      const data = result.data as unknown[];
      if (!data || data.length === 0) {
        return {
          data: null,
          error: { message: "No rows found", code: "PGRST116" },
        };
      }
      if (data.length > 1) {
        return {
          data: null,
          error: { message: "Multiple rows found", code: "PGRST116" },
        };
      }
      return { data: data[0] as T, error: null };
    });
  }

  maybeSingle(): Promise<MockQueryResult<T | null>> {
    return this.execute().then((result) => {
      if (result.error) return result as MockQueryResult<T | null>;
      
      const data = result.data as unknown[];
      if (!data || data.length === 0) {
        return { data: null, error: null };
      }
      if (data.length > 1) {
        return {
          data: null,
          error: { message: "Multiple rows found", code: "PGRST116" },
        };
      }
      return { data: data[0] as T, error: null };
    });
  }

  then<TResult>(
    onfulfilled?: (value: MockQueryResult<T[]>) => TResult | PromiseLike<TResult>
  ): Promise<TResult> {
    return this.execute().then(onfulfilled as (value: MockQueryResult<unknown[]>) => TResult);
  }

  // ============================================================================
  // EXECUTION
  // ============================================================================

  private async execute(): Promise<MockQueryResult<unknown[]>> {
    // Check for forced error
    if (this.forceError) {
      return { data: null, error: this.forceError };
    }

    const tableData = this.dataStore.get(this.state.table) ?? [];

    switch (this.state.operation) {
      case "select":
        return this.executeSelect(tableData);
      case "insert":
        return this.executeInsert();
      case "update":
        return this.executeUpdate(tableData);
      case "upsert":
        return this.executeUpsert(tableData);
      case "delete":
        return this.executeDelete(tableData);
      default:
        return { data: null, error: { message: "Unknown operation" } };
    }
  }

  private executeSelect(tableData: unknown[]): MockQueryResult<unknown[]> {
    let result = this.applyFilters(tableData);
    result = this.applyOrder(result);
    result = this.applyRangeAndLimit(result);
    return { data: result, error: null, count: result.length };
  }

  private executeInsert(): MockQueryResult<unknown[]> {
    const data = this.state.insertData;
    const tableData = this.dataStore.get(this.state.table) ?? [];
    
    const records = Array.isArray(data) ? data : [data];
    const inserted = records.map((record) => ({
      ...record as Record<string, unknown>,
      id: (record as Record<string, unknown>).id ?? crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }));

    this.dataStore.set(this.state.table, [...tableData, ...inserted]);
    return { data: inserted, error: null };
  }

  private executeUpdate(tableData: unknown[]): MockQueryResult<unknown[]> {
    const updates = this.state.updateData as Record<string, unknown>;
    const filtered = this.applyFilters(tableData);
    const filteredIds = new Set(filtered.map((r) => (r as Record<string, unknown>).id));

    const updated: unknown[] = [];
    const newData = tableData.map((record) => {
      const rec = record as Record<string, unknown>;
      if (filteredIds.has(rec.id)) {
        const updatedRecord = { ...rec, ...updates, updated_at: new Date().toISOString() };
        updated.push(updatedRecord);
        return updatedRecord;
      }
      return record;
    });

    this.dataStore.set(this.state.table, newData);
    return { data: updated, error: null };
  }

  private executeUpsert(tableData: unknown[]): MockQueryResult<unknown[]> {
    const data = this.state.insertData;
    const records = Array.isArray(data) ? data : [data];
    
    const existingIds = new Set(tableData.map((r) => (r as Record<string, unknown>).id));
    const toInsert: unknown[] = [];
    const toUpdate: unknown[] = [];

    for (const record of records) {
      const rec = record as Record<string, unknown>;
      if (existingIds.has(rec.id)) {
        toUpdate.push(rec);
      } else {
        toInsert.push({
          ...rec,
          id: rec.id ?? crypto.randomUUID(),
          created_at: new Date().toISOString(),
        });
      }
    }

    // Update existing records
    let newData = tableData.map((existing) => {
      const ex = existing as Record<string, unknown>;
      const update = toUpdate.find((u) => (u as Record<string, unknown>).id === ex.id);
      if (update) {
        return { ...ex, ...update as Record<string, unknown>, updated_at: new Date().toISOString() };
      }
      return existing;
    });

    // Insert new records
    newData = [...newData, ...toInsert];
    this.dataStore.set(this.state.table, newData);

    return { data: [...toUpdate, ...toInsert], error: null };
  }

  private executeDelete(tableData: unknown[]): MockQueryResult<unknown[]> {
    const filtered = this.applyFilters(tableData);
    const filteredIds = new Set(filtered.map((r) => (r as Record<string, unknown>).id));

    const remaining = tableData.filter((record) => {
      return !filteredIds.has((record as Record<string, unknown>).id);
    });

    this.dataStore.set(this.state.table, remaining);
    return { data: filtered, error: null };
  }

  // ============================================================================
  // FILTER HELPERS
  // ============================================================================

  private applyFilters(data: unknown[]): unknown[] {
    return data.filter((record) => {
      const rec = record as Record<string, unknown>;
      return this.state.filters.every((filter) => {
        const value = rec[filter.column];
        return this.matchFilter(value, filter);
      });
    });
  }

  private matchFilter(value: unknown, filter: Filter): boolean {
    switch (filter.operator) {
      case "eq":
        return value === filter.value;
      case "neq":
        return value !== filter.value;
      case "gt":
        return (value as number) > (filter.value as number);
      case "gte":
        return (value as number) >= (filter.value as number);
      case "lt":
        return (value as number) < (filter.value as number);
      case "lte":
        return (value as number) <= (filter.value as number);
      case "like":
        return new RegExp(String(filter.value).replace(/%/g, ".*")).test(String(value));
      case "ilike":
        return new RegExp(String(filter.value).replace(/%/g, ".*"), "i").test(String(value));
      case "is":
        return value === filter.value;
      case "in":
        return (filter.value as unknown[]).includes(value);
      default:
        return true;
    }
  }

  private applyOrder(data: unknown[]): unknown[] {
    if (!this.state.orderBy) return data;

    const { column, ascending } = this.state.orderBy;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[column];
      const bVal = (b as Record<string, unknown>)[column];
      
      // Type-safe comparison for sorting
      if (aVal === null || aVal === undefined) return ascending ? 1 : -1;
      if (bVal === null || bVal === undefined) return ascending ? -1 : 1;
      
      // Handle string comparison
      if (typeof aVal === "string" && typeof bVal === "string") {
        return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      // Handle number comparison
      if (typeof aVal === "number" && typeof bVal === "number") {
        return ascending ? aVal - bVal : bVal - aVal;
      }
      
      // Fallback: convert to string and compare
      const aStr = String(aVal);
      const bStr = String(bVal);
      return ascending ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }

  private applyRangeAndLimit(data: unknown[]): unknown[] {
    let result = data;

    if (this.state.rangeFrom !== null && this.state.rangeTo !== null) {
      result = result.slice(this.state.rangeFrom, this.state.rangeTo + 1);
    }

    if (this.state.limitCount !== null) {
      result = result.slice(0, this.state.limitCount);
    }

    return result;
  }
}

// ============================================================================
// MOCK AUTH
// ============================================================================

interface MockAuth {
  getUser(): Promise<{ data: { user: MockUser | null }; error: MockError | null }>;
  getSession(): Promise<{ data: { session: MockSession | null }; error: MockError | null }>;
  admin: {
    createUser(data: { email: string; password: string }): Promise<{ data: { user: MockUser }; error: MockError | null }>;
    deleteUser(userId: string): Promise<{ data: null; error: MockError | null }>;
  };
}

// ============================================================================
// MOCK SUPABASE CLIENT
// ============================================================================

export interface MockSupabaseClient {
  from<T = unknown>(table: string): MockQueryBuilder<T>;
  auth: MockAuth;
  rpc<T = unknown>(fn: string, params?: unknown): Promise<MockQueryResult<T>>;
}

/**
 * Creates a mock Supabase client for testing.
 * Replaces 14 local implementations with a single centralized version.
 * 
 * @example
 * ```typescript
 * const client = createMockSupabaseClient({
 *   mockData: createMockDataStore({
 *     users: [{ id: "1", email: "test@example.com" }]
 *   }),
 *   authUser: createMockUser(),
 * });
 * 
 * const { data } = await client.from("users").select("*").eq("id", "1");
 * ```
 */
export function createMockSupabaseClient(
  config: MockSupabaseClientConfig = {}
): MockSupabaseClient {
  const {
    mockData = new Map(),
    authUser = null,
    authSession = null,
    rpcHandlers = {},
    forceError = null,
  } = config;

  const auth: MockAuth = {
    async getUser() {
      if (forceError) {
        return { data: { user: null }, error: forceError };
      }
      return { data: { user: authUser }, error: null };
    },
    async getSession() {
      if (forceError) {
        return { data: { session: null }, error: forceError };
      }
      return { data: { session: authSession }, error: null };
    },
    admin: {
      async createUser(data: { email: string; password: string }) {
        const newUser: MockUser = {
          id: crypto.randomUUID(),
          email: data.email,
          name: null,
          role: "user",
          account_status: "active",
          is_active: true,
          email_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return { data: { user: newUser }, error: null };
      },
      async deleteUser(_userId: string) {
        return { data: null, error: null };
      },
    },
  };

  return {
    from<T = unknown>(table: string): MockQueryBuilder<T> {
      return new MockQueryBuilder<T>(table, mockData, forceError);
    },
    auth,
    async rpc<T = unknown>(fn: string, params?: unknown): Promise<MockQueryResult<T>> {
      if (forceError) {
        return { data: null, error: forceError };
      }
      
      const handler = rpcHandlers[fn];
      if (handler) {
        try {
          const result = await handler(params);
          return { data: result as T, error: null };
        } catch (err) {
          return {
            data: null,
            error: { message: err instanceof Error ? err.message : "RPC error" },
          };
        }
      }
      
      return { data: null, error: { message: `RPC function '${fn}' not mocked` } };
    },
  };
}

/**
 * Creates an empty MockDataStore.
 * Convenience function for type safety.
 */
export function createEmptyDataStore(): MockDataStore {
  return new Map();
}

/**
 * Creates a MockDataStore from an object of table data.
 * 
 * @example
 * ```typescript
 * const store = createMockDataStore({
 *   users: [{ id: "1", email: "test@test.com" }],
 *   products: [{ id: "p1", name: "Product 1" }],
 * });
 * ```
 */
export function createMockDataStore(
  data: Record<string, unknown[]>
): MockDataStore {
  const store = new Map<string, unknown[]>();
  for (const [table, records] of Object.entries(data)) {
    store.set(table, records);
  }
  return store;
}
