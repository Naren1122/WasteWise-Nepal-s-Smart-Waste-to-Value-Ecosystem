import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EsewaProvider } from '../esewa.provider.js';
import { PaymentGateway } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('EsewaProvider (ePay v2)', () => {
  let provider: EsewaProvider;

  beforeEach(() => {
    provider = new EsewaProvider();
    vi.restoreAllMocks();
  });

  describe('generateSignature & initiatePayment', () => {
    it('should generate signature and form data for eSewa checkout', async () => {
      const mockInvoice = {
        id: 'inv-1',
        totalAmount: new Decimal(150),
      } as any;

      const mockPayer = {
        id: 'user-1',
        email: 'ram@kathmandu.gov.np',
        role: 'CITIZEN',
      } as any;

      const result = await provider.initiatePayment({
        tenantId: 'tenant-1',
        invoice: mockInvoice,
        payer: mockPayer,
        transactionReference: 'TX-UUID-12345',
      });

      expect(result.gateway).toBe(PaymentGateway.ESEWA);
      expect(result.amount).toBe(150);
      expect(result.formData).toBeDefined();
      expect(result.formData?.product_code).toBe('EPAYTEST');
      expect(result.formData?.total_amount).toBe('150.00');
      expect(result.formData?.transaction_uuid).toBe('TX-UUID-12345');
      expect(result.formData?.signature).toBeTruthy();
    });
  });

  describe('verifyPayment', () => {
    const transactionUuid = 'TX-UUID-12345';
    const amount = '150.00';
    const productCode = 'EPAYTEST';

    it('should successfully verify when HMAC signature matches and status is COMPLETE', async () => {
      const validSignature = provider.generateSignature(amount, transactionUuid, productCode);

      const payloadObj = {
        transaction_code: 'ESEWA-REF-999',
        status: 'COMPLETE',
        total_amount: amount,
        transaction_uuid: transactionUuid,
        product_code: productCode,
        signature: validSignature,
      };

      const encodedData = Buffer.from(JSON.stringify(payloadObj)).toString('base64');

      // Mock server-to-server status check
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'COMPLETE', ref_id: 'ESEWA-REF-999' }),
      } as any);

      const verification = await provider.verifyPayment({
        tenantId: 'tenant-1',
        payload: { data: encodedData },
      });

      expect(verification.isVerified).toBe(true);
      expect(verification.transactionReference).toBe(transactionUuid);
      expect(verification.gatewayRefId).toBe('ESEWA-REF-999');
      expect(verification.paidAmount).toBe(150);
    });

    it('should fail verification when signature is tampered (security integrity)', async () => {
      const tamperedPayload = {
        transaction_code: 'ESEWA-REF-999',
        status: 'COMPLETE',
        total_amount: amount,
        transaction_uuid: transactionUuid,
        product_code: productCode,
        signature: 'INVALID_OR_TAMPERED_SIGNATURE',
      };

      const encodedData = Buffer.from(JSON.stringify(tamperedPayload)).toString('base64');

      const verification = await provider.verifyPayment({
        tenantId: 'tenant-1',
        payload: { data: encodedData },
      });

      expect(verification.isVerified).toBe(false);
      expect(verification.errorMessage).toContain('HMAC-SHA256 signature verification failed');
    });

    it('should fail verification when transaction status is not COMPLETE', async () => {
      const validSignature = provider.generateSignature(amount, transactionUuid, productCode);

      const pendingPayload = {
        transaction_code: 'ESEWA-REF-999',
        status: 'PENDING',
        total_amount: amount,
        transaction_uuid: transactionUuid,
        product_code: productCode,
        signature: validSignature,
      };

      const encodedData = Buffer.from(JSON.stringify(pendingPayload)).toString('base64');

      const verification = await provider.verifyPayment({
        tenantId: 'tenant-1',
        payload: { data: encodedData },
      });

      expect(verification.isVerified).toBe(false);
      expect(verification.errorMessage).toContain('eSewa transaction not complete');
    });
    it('should successfully verify when eSewa v2 signed_field_names dynamic HMAC signature is used', async () => {
      const crypto = await import('node:crypto');
      const secretKey = '8gBm/:&EnhH.1/q';
      const signedFieldNames = 'transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names';
      const rawMap: Record<string, string> = {
        transaction_code: 'ESW-REAL-1234',
        status: 'COMPLETE',
        total_amount: '600.0',
        transaction_uuid: transactionUuid,
        product_code: productCode,
        signed_field_names: signedFieldNames,
      };

      const message = signedFieldNames
        .split(',')
        .map((f) => `${f}=${rawMap[f]}`)
        .join(',');

      const signature = crypto.createHmac('sha256', secretKey).update(message).digest('base64');
      const payloadObj = { ...rawMap, signature };
      const encodedData = Buffer.from(JSON.stringify(payloadObj)).toString('base64');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'COMPLETE', ref_id: 'ESW-REAL-1234' }),
      } as unknown as Response);

      const verification = await provider.verifyPayment({
        tenantId: 'tenant-1',
        payload: { data: encodedData },
      });

      expect(verification.isVerified).toBe(true);
      expect(verification.transactionReference).toBe(transactionUuid);
      expect(verification.gatewayRefId).toBe('ESW-REAL-1234');
      expect(verification.paidAmount).toBe(600);
    });
  });
});

