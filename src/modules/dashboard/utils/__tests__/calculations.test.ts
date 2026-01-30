/**
 * Dashboard Calculations Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculatePercentageChange,
  calculateGatewayFee,
  calculateMetricsFromRpc,
  calculateHourlyChartData,
  calculateChartData,
} from '../calculations';
import type { RpcDashboardMetrics, Order } from '../../types';

// Mock dependencies
vi.mock('@/lib/timezone', () => ({
  timezoneService: {
    getHourInTimezone: vi.fn((date: string | Date) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.getUTCHours();
    }),
    getDateInTimezone: vi.fn((date: string | Date) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toISOString().split('T')[0];
    }),
  },
}));

describe('calculations', () => {
  describe('calculatePercentageChange', () => {
    it('should calculate positive change correctly', () => {
      expect(calculatePercentageChange(150, 100)).toBe(50);
      expect(calculatePercentageChange(200, 100)).toBe(100);
    });

    it('should calculate negative change correctly', () => {
      expect(calculatePercentageChange(50, 100)).toBe(-50);
      expect(calculatePercentageChange(75, 100)).toBe(-25);
    });

    it('should return 100% when previous is 0 and current > 0', () => {
      expect(calculatePercentageChange(100, 0)).toBe(100);
      expect(calculatePercentageChange(1, 0)).toBe(100);
    });

    it('should return 0% when both are 0', () => {
      expect(calculatePercentageChange(0, 0)).toBe(0);
    });

    it('should return 0% when current is 0 and previous is 0', () => {
      expect(calculatePercentageChange(0, 0)).toBe(0);
    });
  });

  describe('calculateGatewayFee', () => {
    it('should calculate fee as 3.99% + R$0.39', () => {
      // R$100,00 = 10000 centavos
      // 3.99% of 10000 = 399 + 39 = 438 centavos
      expect(calculateGatewayFee(10000)).toBe(438);
    });

    it('should calculate fee for small amounts', () => {
      // R$10,00 = 1000 centavos
      // 3.99% of 1000 = 39.9 (rounded) + 39 = ~79
      expect(calculateGatewayFee(1000)).toBe(79);
    });

    it('should return minimum fee for zero amount', () => {
      // 0 * 0.0399 + 39 = 39
      expect(calculateGatewayFee(0)).toBe(39);
    });
  });

  describe('calculateMetricsFromRpc', () => {
    const createRpcMetrics = (overrides: Partial<RpcDashboardMetrics> = {}): RpcDashboardMetrics => ({
      paid_revenue_cents: 0,
      pending_revenue_cents: 0,
      total_revenue_cents: 0,
      paid_count: 0,
      pending_count: 0,
      total_count: 0,
      fees_cents: 0,
      pix_revenue_cents: 0,
      credit_card_revenue_cents: 0,
      ...overrides,
    });

    it('should calculate metrics correctly', () => {
      const current = createRpcMetrics({
        paid_revenue_cents: 50000,
        pending_revenue_cents: 10000,
        total_revenue_cents: 60000,
        paid_count: 5,
        pending_count: 2,
        total_count: 10,
        fees_cents: 2000,
      });
      const previous = createRpcMetrics({
        paid_revenue_cents: 40000,
        paid_count: 4,
        total_count: 8,
      });

      const result = calculateMetricsFromRpc(current, previous, '7days');

      expect(result.totalPaidOrders).toBe(5);
      expect(result.totalPendingOrders).toBe(2);
      expect(result.conversionRate).toBe('50.00%');
    });

    it('should calculate average ticket correctly', () => {
      const current = createRpcMetrics({
        paid_revenue_cents: 30000,
        paid_count: 3,
      });
      const previous = createRpcMetrics();

      const result = calculateMetricsFromRpc(current, previous, 'today');

      // Average ticket = 30000 / 3 = 10000 cents = R$100
      expect(result.averageTicket).toContain('100');
    });

    it('should handle zero division', () => {
      const current = createRpcMetrics();
      const previous = createRpcMetrics();

      const result = calculateMetricsFromRpc(current, previous, 'today');

      expect(result.conversionRate).toBe('0.00%');
    });

    it('should calculate trend labels for different presets', () => {
      const current = createRpcMetrics();
      const previous = createRpcMetrics();

      const resultToday = calculateMetricsFromRpc(current, previous, 'today');
      expect(resultToday.revenueTrend.label).toBe('vs. ontem');

      const result7days = calculateMetricsFromRpc(current, previous, '7days');
      expect(result7days.revenueTrend.label).toBe('vs. semana anterior');

      const result30days = calculateMetricsFromRpc(current, previous, '30days');
      expect(result30days.revenueTrend.label).toBe('vs. mês anterior');
    });
  });

  describe('calculateHourlyChartData', () => {
    it('should initialize all 24 hours', () => {
      const result = calculateHourlyChartData([], new Date());

      expect(result).toHaveLength(24);
      expect(result[0].date).toBe('00:00');
      expect(result[23].date).toBe('23:00');
    });

    it('should aggregate revenue by hour', () => {
      const orders: Order[] = [
        { 
          id: '1', 
          created_at: '2024-01-15T10:00:00Z', 
          status: 'paid', 
          amount_cents: 10000,
          customer_email: 'test@test.com',
        } as Order,
        { 
          id: '2', 
          created_at: '2024-01-15T10:30:00Z', 
          status: 'paid', 
          amount_cents: 5000,
          customer_email: 'test2@test.com',
        } as Order,
      ];

      const result = calculateHourlyChartData(orders, new Date('2024-01-15'));

      expect(result[10].revenue).toBe(150); // 10000 + 5000 = 15000 cents = R$150
      expect(result[10].emails).toBe(2);
    });

    it('should only count paid orders for revenue', () => {
      const orders: Order[] = [
        { 
          id: '1', 
          created_at: '2024-01-15T10:00:00Z', 
          status: 'paid', 
          amount_cents: 10000,
        } as Order,
        { 
          id: '2', 
          created_at: '2024-01-15T10:30:00Z', 
          status: 'pending', 
          amount_cents: 5000,
        } as Order,
      ];

      const result = calculateHourlyChartData(orders, new Date('2024-01-15'));

      expect(result[10].revenue).toBe(100); // Only paid order
    });
  });

  describe('calculateChartData', () => {
    it('should group orders by date', () => {
      const orders: Order[] = [
        { 
          id: '1', 
          created_at: '2024-01-15T10:00:00Z', 
          status: 'paid', 
          amount_cents: 10000,
        } as Order,
        { 
          id: '2', 
          created_at: '2024-01-16T10:00:00Z', 
          status: 'paid', 
          amount_cents: 5000,
        } as Order,
      ];

      const result = calculateChartData(
        orders,
        new Date('2024-01-14'),
        new Date('2024-01-17')
      );

      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('should generate empty data points when no orders', () => {
      const result = calculateChartData(
        [],
        new Date('2024-01-01'),
        new Date('2024-01-07')
      );

      expect(result.length).toBeGreaterThan(0);
      result.forEach(point => {
        expect(point.revenue).toBe(0);
      });
    });

    it('should sort data points by date', () => {
      const orders: Order[] = [
        { 
          id: '2', 
          created_at: '2024-01-16T10:00:00Z', 
          status: 'paid', 
          amount_cents: 5000,
        } as Order,
        { 
          id: '1', 
          created_at: '2024-01-15T10:00:00Z', 
          status: 'paid', 
          amount_cents: 10000,
        } as Order,
      ];

      const result = calculateChartData(
        orders,
        new Date('2024-01-14'),
        new Date('2024-01-17')
      );

      // Should be sorted ascending
      for (let i = 1; i < result.length; i++) {
        expect(result[i].date >= result[i-1].date).toBe(true);
      }
    });
  });
});
