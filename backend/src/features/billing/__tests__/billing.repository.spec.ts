import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingRepository } from '../billing.repository.js';
import { prisma } from '../../../shared/database/prisma.service.js';
import { InvoiceStatus, InvoiceItemType } from '@prisma/client';

vi.mock('../../../shared/database/prisma.service.js', () => ({
  prisma: {
    invoice: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      findMany: vi.fn(),
    },
  },
}));

describe('BillingRepository', () => {
  let repo: BillingRepository;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const citizenId = '00000000-0000-0000-0000-000000000002';
  const propertyId = '00000000-0000-0000-0000-000000000003';

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new BillingRepository();
  });

  describe('createInvoice', () => {
    it('should format nested items without top-level tenantId to respect Prisma relation mapping', async () => {
      const mockCreated = {
        id: 'inv-1',
        tenantId,
        invoiceNumber: 'INV-202611-00001',
      };
      vi.mocked(prisma.invoice.create).mockResolvedValue(mockCreated as unknown as never);

      const dueDate = new Date('2026-11-20');
      await repo.createInvoice({
        tenantId,
        citizenId,
        propertyId,
        invoiceNumber: 'INV-202611-00001',
        billingMonth: 11,
        billingYear: 2026,
        subtotalAmount: 450,
        totalAmount: 450,
        dueDate,
        status: InvoiceStatus.ISSUED,
        items: [
          {
            itemType: InvoiceItemType.SUBSCRIPTION_FEE,
            description: 'Monthly Waste Fee',
            quantity: 1,
            unitPrice: 450,
            totalPrice: 450,
          },
        ],
      });

      expect(prisma.invoice.create).toHaveBeenCalledTimes(1);
      const callArg = vi.mocked(prisma.invoice.create).mock.calls[0]?.[0];
      expect(callArg).toBeDefined();
      if (!callArg) return;

      const itemsCreate = (callArg.data.items as { create: Array<{ tenantId?: string }> }).create;
      expect(callArg.data.tenantId).toBe(tenantId);
      expect(itemsCreate[0]?.tenantId).toBeUndefined();
    });
  });
});
