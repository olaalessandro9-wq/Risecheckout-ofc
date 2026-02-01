/**
 * Test Mocks for Edge Functions Integration Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Mocks for external APIs and services used in integration tests.
 * 
 * @module _shared/test-mocks
 */

// ============================================================================
// Cloudflare Turnstile API Mock
// ============================================================================

export interface TurnstileResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
}

export class CloudflareTurnstileMock {
  private validTokens: Set<string> = new Set();
  private usedTokens: Set<string> = new Set();
  
  /**
   * Register a valid token for testing
   */
  addValidToken(token: string): void {
    this.validTokens.add(token);
  }
  
  /**
   * Mock the Cloudflare Turnstile verification endpoint
   */
  async verify(secret: string, token: string, remoteip?: string): Promise<TurnstileResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Check if secret is valid
    if (!secret || secret === "invalid_secret") {
      return {
        success: false,
        "error-codes": ["invalid-input-secret"],
      };
    }
    
    // Check if token is missing
    if (!token) {
      return {
        success: false,
        "error-codes": ["missing-input-response"],
      };
    }
    
    // Check if token was already used (replay attack)
    if (this.usedTokens.has(token)) {
      return {
        success: false,
        "error-codes": ["timeout-or-duplicate"],
      };
    }
    
    // Check if token is valid
    if (this.validTokens.has(token)) {
      this.usedTokens.add(token);
      return {
        success: true,
        challenge_ts: new Date().toISOString(),
        hostname: "risecheckout.com",
        action: "login",
      };
    }
    
    // Invalid token
    return {
      success: false,
      "error-codes": ["invalid-input-response"],
    };
  }
  
  /**
   * Reset mock state
   */
  reset(): void {
    this.validTokens.clear();
    this.usedTokens.clear();
  }
}

// Global instance for tests
export const turnstileMock = new CloudflareTurnstileMock();

// ============================================================================
// Fetch Mock Interceptor
// ============================================================================

export interface MockFetchConfig {
  url: string | RegExp;
  method?: string;
  response: Response | ((request: Request) => Response | Promise<Response>);
}

export class FetchMock {
  private mocks: MockFetchConfig[] = [];
  private originalFetch?: typeof globalThis.fetch;
  
  /**
   * Add a mock response for a URL pattern
   */
  add(config: MockFetchConfig): void {
    this.mocks.push(config);
  }
  
  /**
   * Install the fetch mock
   */
  install(): void {
    this.originalFetch = globalThis.fetch;
    
    globalThis.fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method || "GET";
      
      // Find matching mock
      for (const mock of this.mocks) {
        const urlMatches = typeof mock.url === "string" 
          ? url.includes(mock.url)
          : mock.url.test(url);
        
        const methodMatches = !mock.method || mock.method === method;
        
        if (urlMatches && methodMatches) {
          if (typeof mock.response === "function") {
            const request = typeof input === "string" 
              ? new Request(input, init)
              : input instanceof Request
              ? input
              : new Request(input.toString(), init);
            return await mock.response(request);
          }
          return mock.response.clone();
        }
      }
      
      // No mock found, use original fetch
      if (this.originalFetch) {
        return this.originalFetch(input, init);
      }
      
      throw new Error(`No mock found for ${method} ${url}`);
    };
  }
  
  /**
   * Uninstall the fetch mock
   */
  uninstall(): void {
    if (this.originalFetch) {
      globalThis.fetch = this.originalFetch;
    }
  }
  
  /**
   * Reset all mocks
   */
  reset(): void {
    this.mocks = [];
  }
}

// ============================================================================
// Email Service Mock
// ============================================================================

export interface MockEmail {
  to: string;
  subject: string;
  body: string;
  timestamp: Date;
}

export class EmailServiceMock {
  private sentEmails: MockEmail[] = [];
  
  /**
   * Mock sending an email
   */
  async send(to: string, subject: string, body: string): Promise<void> {
    this.sentEmails.push({
      to,
      subject,
      body,
      timestamp: new Date(),
    });
  }
  
  /**
   * Get all sent emails
   */
  getSentEmails(): MockEmail[] {
    return [...this.sentEmails];
  }
  
  /**
   * Find emails by recipient
   */
  findByRecipient(email: string): MockEmail[] {
    return this.sentEmails.filter(e => e.to === email);
  }
  
  /**
   * Find emails by subject pattern
   */
  findBySubject(pattern: string | RegExp): MockEmail[] {
    if (typeof pattern === "string") {
      return this.sentEmails.filter(e => e.subject.includes(pattern));
    }
    return this.sentEmails.filter(e => pattern.test(e.subject));
  }
  
  /**
   * Reset mock state
   */
  reset(): void {
    this.sentEmails = [];
  }
}

// Global instance for tests
export const emailMock = new EmailServiceMock();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a mock Cloudflare Turnstile verification response
 */
export function mockTurnstileVerification(
  success: boolean,
  errorCodes?: string[]
): Response {
  const body: TurnstileResponse = success
    ? {
        success: true,
        challenge_ts: new Date().toISOString(),
        hostname: "risecheckout.com",
      }
    : {
        success: false,
        "error-codes": errorCodes || ["invalid-input-response"],
      };
  
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Generate a valid test Turnstile token
 */
export function generateTestTurnstileToken(): string {
  const token = `test-turnstile-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  turnstileMock.addValidToken(token);
  return token;
}
