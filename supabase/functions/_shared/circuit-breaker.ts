/**
 * ============================================================================
 * CIRCUIT BREAKER - Proteção contra Falhas em Cascata
 * ============================================================================
 * 
 * Implementação do padrão Circuit Breaker para APIs externas.
 * Previne que falhas em um serviço externo causem esgotamento de recursos.
 * 
 * Estados:
 * - CLOSED: Operação normal, requisições passam
 * - OPEN: Serviço indisponível, requisições bloqueadas imediatamente
 * - HALF_OPEN: Teste de recuperação, permite 1 requisição
 * 
 * Versão: 1.0
 * Data: 2026-01-11
 * ============================================================================
 */

// ============================================================================
// TYPES
// ============================================================================

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** Nome único do circuit (usado para logs e estado) */
  name: string;
  /** Número de falhas para abrir o circuit */
  failureThreshold: number;
  /** Número de sucessos em HALF_OPEN para fechar */
  successThreshold: number;
  /** Tempo em ms que o circuit fica OPEN antes de ir para HALF_OPEN */
  timeout: number;
  /** Janela de tempo em ms para contar falhas (reset após expirar) */
  windowSize: number;
}

interface CircuitInternalState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: number;
  lastStateChange: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: Omit<CircuitBreakerConfig, 'name'> = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30000,     // 30 segundos
  windowSize: 60000   // 1 minuto
};

// Estado global por circuit (persiste entre invocações da mesma instância)
const circuitStates = new Map<string, CircuitInternalState>();

// ============================================================================
// ERRORS
// ============================================================================

/**
 * Erro lançado quando o circuit está OPEN
 */
export class CircuitOpenError extends Error {
  public readonly circuitName: string;
  public readonly retryAfterMs: number;

  constructor(circuitName: string, retryAfterMs: number = 30000) {
    super(`Circuit '${circuitName}' está OPEN - serviço temporariamente indisponível`);
    this.name = 'CircuitOpenError';
    this.circuitName = circuitName;
    this.retryAfterMs = retryAfterMs;
  }
}

// ============================================================================
// CIRCUIT BREAKER CLASS
// ============================================================================

export class CircuitBreaker {
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> & { name: string }) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Inicializar estado se não existir
    if (!circuitStates.has(this.config.name)) {
      circuitStates.set(this.config.name, {
        state: 'CLOSED',
        failures: 0,
        successes: 0,
        lastFailure: 0,
        lastStateChange: Date.now()
      });
    }
  }

  /**
   * Executa uma operação protegida pelo circuit breaker
   * 
   * @param operation - Função assíncrona a ser executada
   * @returns Resultado da operação
   * @throws CircuitOpenError se o circuit estiver aberto
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const circuit = circuitStates.get(this.config.name)!;
    const now = Date.now();

    // Verificar transição OPEN → HALF_OPEN
    if (circuit.state === 'OPEN') {
      const timeSinceOpen = now - circuit.lastStateChange;
      
      if (timeSinceOpen >= this.config.timeout) {
        // Transicionar para HALF_OPEN
        circuit.state = 'HALF_OPEN';
        circuit.successes = 0;
        circuit.lastStateChange = now;
        console.log(`[CircuitBreaker:${this.config.name}] OPEN → HALF_OPEN (${timeSinceOpen}ms)`);
      } else {
        // Ainda em período de bloqueio
        const retryAfter = this.config.timeout - timeSinceOpen;
        throw new CircuitOpenError(this.config.name, retryAfter);
      }
    }

    try {
      const result = await operation();
      this.onSuccess(circuit, now);
      return result;
    } catch (error) {
      this.onFailure(circuit, now);
      throw error;
    }
  }

  /**
   * Registra sucesso e atualiza estado
   */
  private onSuccess(circuit: CircuitInternalState, now: number): void {
    if (circuit.state === 'HALF_OPEN') {
      circuit.successes++;
      console.log(`[CircuitBreaker:${this.config.name}] HALF_OPEN: sucesso ${circuit.successes}/${this.config.successThreshold}`);
      
      if (circuit.successes >= this.config.successThreshold) {
        // Serviço recuperado, fechar circuit
        circuit.state = 'CLOSED';
        circuit.failures = 0;
        circuit.successes = 0;
        circuit.lastStateChange = now;
        console.log(`[CircuitBreaker:${this.config.name}] HALF_OPEN → CLOSED ✅ (recuperado)`);
      }
    } else if (circuit.state === 'CLOSED') {
      // Reset contador de falhas em sucesso
      circuit.failures = 0;
    }
  }

  /**
   * Registra falha e atualiza estado
   */
  private onFailure(circuit: CircuitInternalState, now: number): void {
    // Limpar falhas antigas fora da janela
    if (now - circuit.lastFailure > this.config.windowSize) {
      circuit.failures = 0;
    }

    circuit.failures++;
    circuit.lastFailure = now;

    if (circuit.state === 'HALF_OPEN') {
      // Falhou durante teste de recuperação
      circuit.state = 'OPEN';
      circuit.lastStateChange = now;
      console.log(`[CircuitBreaker:${this.config.name}] HALF_OPEN → OPEN ❌ (falhou no teste)`);
    } else if (circuit.state === 'CLOSED' && circuit.failures >= this.config.failureThreshold) {
      // Atingiu threshold de falhas
      circuit.state = 'OPEN';
      circuit.lastStateChange = now;
      console.log(`[CircuitBreaker:${this.config.name}] CLOSED → OPEN ❌ (${circuit.failures} falhas)`);
    } else if (circuit.state === 'CLOSED') {
      console.log(`[CircuitBreaker:${this.config.name}] Falha ${circuit.failures}/${this.config.failureThreshold}`);
    }
  }

  /**
   * Retorna o estado atual do circuit
   */
  getState(): CircuitState {
    return circuitStates.get(this.config.name)!.state;
  }

  /**
   * Reseta o circuit para estado CLOSED
   * Útil para testes ou reset manual
   */
  reset(): void {
    const circuit = circuitStates.get(this.config.name)!;
    circuit.state = 'CLOSED';
    circuit.failures = 0;
    circuit.successes = 0;
    circuit.lastStateChange = Date.now();
    console.log(`[CircuitBreaker:${this.config.name}] Reset manual → CLOSED`);
  }

  /**
   * Retorna métricas do circuit
   */
  getMetrics(): { state: CircuitState; failures: number; lastFailure: number } {
    const circuit = circuitStates.get(this.config.name)!;
    return {
      state: circuit.state,
      failures: circuit.failures,
      lastFailure: circuit.lastFailure
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Configurações pré-definidas para gateways de pagamento
 */
export const GATEWAY_CIRCUIT_CONFIGS: Record<string, Partial<CircuitBreakerConfig>> = {
  mercadopago: {
    name: 'mercadopago-api',
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30000,
    windowSize: 60000
  },
  pushinpay: {
    name: 'pushinpay-api',
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30000,
    windowSize: 60000
  },
  asaas: {
    name: 'asaas-api',
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30000,
    windowSize: 60000
  },
  stripe: {
    name: 'stripe-api',
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30000,
    windowSize: 60000
  }
};

/**
 * Cria um CircuitBreaker para um gateway específico
 */
export function createGatewayCircuitBreaker(gateway: keyof typeof GATEWAY_CIRCUIT_CONFIGS): CircuitBreaker {
  const config = GATEWAY_CIRCUIT_CONFIGS[gateway];
  if (!config) {
    throw new Error(`Gateway '${gateway}' não possui configuração de CircuitBreaker`);
  }
  return new CircuitBreaker(config as CircuitBreakerConfig);
}
