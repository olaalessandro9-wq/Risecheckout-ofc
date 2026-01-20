/**
 * Financeiro Module - Barrel Export
 * 
 * @module modules/financeiro
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// Machines
export { financeiroMachine, type FinanceiroMachine } from "./machines";
export type {
  FinanceiroMachineContext,
  FinanceiroMachineEvent,
} from "./machines";

// Context
export { FinanceiroProvider, useFinanceiroContext } from "./context";

// Components
export { GatewayList, GatewayConfigSheet } from "./components";
