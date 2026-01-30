/**
 * Dashboard Formatters Tests
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { describe, it, expect, vi } from 'vitest';
import {
  formatCurrency,
  formatDate,
  translateStatus,
  getStatusColors,
  isStatusPaid,
  isStatusPending,
  formatDocument,
  formatRecentCustomers,
} from '../formatters';
import type { Order } from '../../types';

// Mock dependencies
vi.mock('@/lib/money', () => ({
  formatCentsToBRL: vi.fn((cents: number) => {
    const value = cents / 100;
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }),
}));

vi.mock('@/lib/timezone', () => ({
  timezoneService: {
    formatFull: vi.fn((date: string) => {
      const d = new Date(date);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }),
  },
}));

vi.mock('@/lib/order-status', () => ({
  orderStatusService: {
    getDisplayLabel: vi.fn((status: string) => {
      const labels: Record<string, string> = {
        paid: 'Pago',
        pending: 'Pendente',
        expired: 'Expirado',
        refunded: 'Reembolsado',
        cancelled: 'Cancelado',
      };
      return labels[status.toLowerCase()] || 'Desconhecido';
    }),
    getColorScheme: vi.fn((status: string) => {
      const isPaid = status.toLowerCase() === 'paid';
      return {
        bg: isPaid ? 'bg-emerald-500/10' : 'bg-amber-500/10',
        text: isPaid ? 'text-emerald-700' : 'text-amber-700',
        border: isPaid ? 'border-emerald-500/20' : 'border-amber-500/20',
      };
    }),
    isPaid: vi.fn((status: string) => status.toLowerCase() === 'paid'),
    isPending: vi.fn((status: string) => status.toLowerCase() === 'pending'),
  },
}));

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format cents to BRL', () => {
      expect(formatCurrency(10000)).toBe('R$ 100,00');
      expect(formatCurrency(1500)).toBe('R$ 15,00');
      expect(formatCurrency(99)).toBe('R$ 0,99');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('R$ 0,00');
    });
  });

  describe('formatDate', () => {
    it('should format date using timezone service', () => {
      const result = formatDate('2024-01-15T10:30:00Z');
      expect(result).toContain('15');
      expect(result).toContain('01');
      expect(result).toContain('2024');
    });
  });

  describe('translateStatus', () => {
    it('should translate paid status', () => {
      expect(translateStatus('paid')).toBe('Pago');
    });

    it('should translate pending status', () => {
      expect(translateStatus('pending')).toBe('Pendente');
    });

    it('should translate expired status', () => {
      expect(translateStatus('expired')).toBe('Expirado');
    });

    it('should return Desconhecido for unknown status', () => {
      expect(translateStatus('unknown_status')).toBe('Desconhecido');
    });
  });

  describe('getStatusColors', () => {
    it('should return emerald colors for paid', () => {
      const colors = getStatusColors('paid');
      expect(colors.bg).toContain('emerald');
      expect(colors.text).toContain('emerald');
    });

    it('should return amber colors for pending', () => {
      const colors = getStatusColors('pending');
      expect(colors.bg).toContain('amber');
      expect(colors.text).toContain('amber');
    });
  });

  describe('isStatusPaid', () => {
    it('should return true for paid status', () => {
      expect(isStatusPaid('paid')).toBe(true);
      expect(isStatusPaid('PAID')).toBe(true);
    });

    it('should return false for non-paid status', () => {
      expect(isStatusPaid('pending')).toBe(false);
      expect(isStatusPaid('expired')).toBe(false);
    });
  });

  describe('isStatusPending', () => {
    it('should return true for pending status', () => {
      expect(isStatusPending('pending')).toBe(true);
      expect(isStatusPending('PENDING')).toBe(true);
    });

    it('should return false for non-pending status', () => {
      expect(isStatusPending('paid')).toBe(false);
      expect(isStatusPending('expired')).toBe(false);
    });
  });

  describe('formatDocument', () => {
    it('should format CPF correctly', () => {
      expect(formatDocument('12345678901')).toBe('123.456.789-01');
    });

    it('should format CNPJ correctly', () => {
      expect(formatDocument('12345678000195')).toBe('12.345.678/0001-95');
    });

    it('should return N/A for null', () => {
      expect(formatDocument(null)).toBe('N/A');
    });

    it('should return original for invalid format', () => {
      expect(formatDocument('123')).toBe('123');
    });

    it('should strip non-digits before formatting', () => {
      expect(formatDocument('123.456.789-01')).toBe('123.456.789-01');
    });
  });

  describe('formatRecentCustomers', () => {
    it('should format orders to recent customers', () => {
      const orders: Order[] = [
        {
          id: 'abc12345-test',
          created_at: '2024-01-15T10:00:00Z',
          status: 'paid',
          amount_cents: 10000,
          customer_name: 'John Doe',
          customer_email: 'john@test.com',
          customer_phone: '11999999999',
          customer_document: '12345678901',
          product: { name: 'Test Product', image_url: 'http://img.jpg', user_id: 'user-1' },
        } as unknown as Order,
      ];

      const result = formatRecentCustomers(orders);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('abc12345');
      expect(result[0].client).toBe('John Doe');
      expect(result[0].email).toBe('john@test.com');
      expect(result[0].status).toBe('Pago');
      expect(result[0].customerDocument).toBe('123.456.789-01');
    });

    it('should handle missing customer data', () => {
      const orders: Order[] = [
        {
          id: 'abc12345-test',
          created_at: '2024-01-15T10:00:00Z',
          status: 'pending',
          amount_cents: 5000,
          customer_name: null,
          customer_email: null,
          customer_phone: null,
          customer_document: null,
          product: null,
        } as unknown as Order,
      ];

      const result = formatRecentCustomers(orders);

      expect(result[0].client).toBe('N/A');
      expect(result[0].email).toBe('N/A');
      expect(result[0].phone).toBe('N/A');
      expect(result[0].offer).toBe('Produto não encontrado');
    });

    it('should handle array of products', () => {
      const orders: Order[] = [
        {
          id: 'abc12345-test',
          created_at: '2024-01-15T10:00:00Z',
          status: 'paid',
          amount_cents: 10000,
          product: [{ name: 'First Product' }, { name: 'Second Product' }],
        } as unknown as Order,
      ];

      const result = formatRecentCustomers(orders);

      expect(result[0].offer).toBe('First Product');
    });
  });
});
