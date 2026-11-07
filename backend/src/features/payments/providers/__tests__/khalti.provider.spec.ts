import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KhaltiProvider } from '../khalti.provider.js';
import { PaymentGateway } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('KhaltiProvider (E-Payment API v2)', () => {
  let provider: KhaltiProvider;

  beforeEach(() => {
    provider = new KhaltiProvider();
    vi.restoreAllMocks();
  });

  describe('initiatePayment', () => {
    it('should convert NPR to integer Paisa and request payment session', async () => {
      const mockInvoice = {
        id: 'inv-12345678-0000-0000-0000-000000000000',
        totalAmount: new Decimal(250.5),
      } as any;

      const mockPayer = {
        id: 'user-1',
        email: 'citizen@kathmandu.gov.np',
        role: 'CITIZEN',
      } as any;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          pidx: 'khalti-pidx-123',
          payment_url: 'https://test-pay.khalti.com/?pidx=khalti-pidx-123',
          expires_in: 1800,
        }),
      } as any);

      const result = await provider.initiatePayment({
        tenantId: 'tenant-1',
        invoice: mockInvoice,
        payer: mockPayer,
        transactionReference: 'TX-REF-1',
      });

      expect(result.gateway).toBe(PaymentGateway.KHALTI);
      expect(result.amount).toBe(250.5);
      expect(result.paymentUrl).toBe('https://test-pay.khalti.com/?pidx=khalti-pidx-123');

      // Verify payload passed to Khalti had amount in Paisa (250.50 NPR = 25050 Paisa)
      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const parsedBody = JSON.parse(fetchCall?.[1]?.body as string);
      expect(parsedBody.amount).toBe(25050);
      expect(parsedBody.purchase_order_id).toBe('TX-REF-1');
    });
  });

  describe('verifyPayment', () => {
    it('should query Khalti lookup API and verify completed payment in NPR', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          pidx: 'khalti-pidx-123',
          total_amount: 25050, // 25050 Paisa
          status: 'Completed',
          transaction_id: 'txn-999',
        }),
      } as any);

      const verification = await provider.verifyPayment({
        tenantId: 'tenant-1',
        payload: { pidx: 'khalti-pidx-123', transactionReference: 'TX-REF-1' },
      });

      expect(verification.isVerified).toBe(true);
      expect(verification.gatewayRefId).toBe('khalti-pidx-123');
      expect(verification.paidAmount).toBe(250.5); // Converted from Paisa to NPR
    });

    it('should return isVerified: false when Khalti status is not Completed', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          pidx: 'khalti-pidx-123',
          total_amount: 25050,
          status: 'User canceled',
        }),
      } as any);

      const verification = await provider.verifyPayment({
        tenantId: 'tenant-1',
        payload: { pidx: 'khalti-pidx-123', transactionReference: 'TX-REF-1' },
      });

      expect(verification.isVerified).toBe(false);
      expect(verification.errorMessage).toContain('status: User canceled');
    });
  });
});

