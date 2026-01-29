/**
 * MSW Server Configuration
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Creates and exports the MSW server instance for Node.js environment.
 * Used in Vitest tests for API mocking.
 * 
 * @module test/mocks/server
 */

import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * MSW Server Instance
 * 
 * The server intercepts all network requests and responds with
 * the mocked handlers defined in ./handlers.ts
 * 
 * Usage in tests:
 * - Server is started automatically via setup.ts
 * - Use server.use() to add one-off handlers for specific tests
 * - Handlers are reset after each test
 * 
 * @example
 * ```typescript
 * import { server } from "@/test/mocks/server";
 * import { http, HttpResponse } from "msw";
 * 
 * test("handles error", async () => {
 *   // Override handler for this test only
 *   server.use(
 *     http.post("/api/endpoint", () => {
 *       return HttpResponse.json({ error: "Failed" }, { status: 500 });
 *     })
 *   );
 *   
 *   // ... test code
 * });
 * ```
 */
export const server = setupServer(...handlers);
