import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingService } from '../billing.service.js';
import type { IBillingRepository, InvoiceWithRelations } from '../billing.types.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../../shared/errors/app-error.js';
import { Role, InvoiceStatus, InvoiceItemType, PropertyType, PropertyStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('BillingService', () => {
  let mockRepo: IBillingRepository;
  let service: BillingService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const citizenId = '00000000-0000-0000-0000-000000000002';
  const otherCitizenId = '00000000-0000-0000-0000-000000000099';
  const propertyId = '00000000-0000-0000-0000-000000000003';
  const invoiceId = '00000000-0000-0000-0000-000000000004';
  const subscriptionId = '00000000-0000-0000-0000-000000000005';

  const mockInvoice: InvoiceWithRelations = {
    id: invoiceId,
    tenantId,
    citizenId,
    propertyId,
    subscriptionId,
    bulkyWasteRequestId: null,
    invoiceNumber: 'INV-202611-00001',
    billingMonth: 11,
    billingYear: 2026,
    subtotalAmount: new Decimal(250),
    discountAmount: new Decimal(0),
    taxAmount: new Decimal(0),
    totalAmount: new Decimal(250),
    status: InvoiceStatus.ISSUED,
    dueDate: new Date('2026-11-20'),
    paidAt: null,
    notes: null,
    createdAt: new Date('2026-11-05'),
    updatedAt: new Date('2026-11-05'),
    citizen: {
      id: citizenId,
      fullName: 'Ram Bahadur',
      email: 'ram@kathmandu.gov.np',
      phone: '+9779851000001',
    },
    property: {
      id: propertyId,
      tenantId,
      wardId: 'ward-1',
      zoneId: null,
      userId: citizenId,
      propertyType: PropertyType.RESIDENTIAL,
      status: PropertyStatus.ACTIVE,
      houseNumber: '124',
      streetAddress: 'Baluwatar Marg',
      latitude: 27.72,
      longitude: 85.33,
      qrCode: 'QR-124',
      contactName: 'Ram Bahadur',
      contactPhone: '+9779851000001',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    items: [
      {
        id: 'item-1',
        tenantId,
        invoiceId,
        itemType: InvoiceItemType.SUBSCRIPTION_FEE,
        description: 'Monthly Waste Fee',
        quantity: 1,
        unitPrice: new Decimal(250),
        totalPrice: new Decimal(250),
        createdAt: new Date(),
      },
    ],
  };

  beforeEach(() => {
    mockRepo = {
      findInvoices: vi.fn(),
      findInvoicesByCitizen: vi.fn(),
      findInvoiceById: vi.fn(),
      createInvoice: vi.fn(),
      updateInvoiceStatus: vi.fn(),
      checkExistingMonthlyInvoice: vi.fn(),
      findActiveSubscriptionsForBilling: vi.fn(),
      getNextInvoiceSequence: vi.fn(),
    };
    service = new BillingService(mockRepo);
  });

  describe('getInvoiceById', () => {
    it('should return invoice detail when invoice exists and caller is authorized', async () => {
      vi.mocked(mockRepo.findInvoiceById).mockResolvedValue(mockInvoice);

      const result = await service.getInvoiceById(tenantId, invoiceId, {
        id: citizenId,
        role: Role.CITIZEN,
      });

      expect(result.id).toBe(invoiceId);
      expect(result.invoiceNumber).toBe('INV-202611-00001');
      expect(result.totalAmount).toBe(250);
      expect(result.items).toHaveLength(1);
    });

    it('should throw NotFoundError if invoice does not exist in tenant', async () => {
      vi.mocked(mockRepo.findInvoiceById).mockResolvedValue(null);

      await expect(service.getInvoiceById(tenantId, invoiceId)).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if citizen caller does not own the invoice', async () => {
      vi.mocked(mockRepo.findInvoiceById).mockResolvedValue(mockInvoice);

      await expect(
        service.getInvoiceById(tenantId, invoiceId, {
          id: otherCitizenId,
          role: Role.CITIZEN,
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should allow municipal admin to view any citizen invoice', async () => {
      vi.mocked(mockRepo.findInvoiceById).mockResolvedValue(mockInvoice);

      const result = await service.getInvoiceById(tenantId, invoiceId, {
        id: 'admin-1',
        role: Role.MUNICIPAL_ADMIN,
      });

      expect(result.id).toBe(invoiceId);
    });
  });

  describe('generateMonthlyInvoices', () => {
    it('should generate invoices for active subscriptions and skip already billed ones', async () => {
      vi.mocked(mockRepo.findActiveSubscriptionsForBilling).mockResolvedValue([
        {
          id: 'sub-1',
          tenantId,
          userId: 'user-1',
          propertyId: 'prop-1',
          plan: { monthlyRateNpr: 300, name: 'Standard Residential' },
        },
        {
          id: 'sub-2',
          tenantId,
          userId: 'user-2',
          propertyId: 'prop-2',
          plan: { monthlyRateNpr: 500, name: 'Commercial Plus' },
        },
      ]);

      // sub-1 is already billed, sub-2 is not
      vi.mocked(mockRepo.checkExistingMonthlyInvoice)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      vi.mocked(mockRepo.getNextInvoiceSequence).mockResolvedValue(1);
      vi.mocked(mockRepo.createInvoice).mockResolvedValue(mockInvoice);

      const summary = await service.generateMonthlyInvoices(tenantId, 11, 2026);

      expect(summary.totalSubscriptionsProcessed).toBe(2);
      expect(summary.invoicesSkippedAlreadyBilled).toBe(1);
      expect(summary.invoicesCreated).toBe(1);
      expect(mockRepo.createInvoice).toHaveBeenCalledOnce();
      expect(mockRepo.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          citizenId: 'user-2',
          propertyId: 'prop-2',
          subscriptionId: 'sub-2',
          billingMonth: 11,
          billingYear: 2026,
          totalAmount: 300 ? 500 : 300, // matches sub-2 plan rate 500
        })
      );
    });
  });

  describe('createCustomInvoice', () => {
    it('should calculate line item totals and persist manual invoice', async () => {
      vi.mocked(mockRepo.getNextInvoiceSequence).mockResolvedValue(42);
      vi.mocked(mockRepo.createInvoice).mockResolvedValue(mockInvoice);

      await service.createCustomInvoice(tenantId, {
        citizenId,
        propertyId,
        billingMonth: 11,
        billingYear: 2026,
        dueDate: '2026-11-25T00:00:00.000Z',
        items: [
          {
            itemType: InvoiceItemType.BULKY_WASTE_FEE,
            description: 'Furniture Disposal Fee',
            quantity: 2,
            unitPrice: 150.5,
          },
        ],
      });

      expect(mockRepo.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          subtotalAmount: 301, // 2 * 150.5 = 301
          totalAmount: 301,
          invoiceNumber: expect.stringContaining('INV-MANUAL-202611-00042'),
        })
      );
    });

    it('should reject invoice creation when item list is empty', async () => {
      await expect(
        service.createCustomInvoice(tenantId, {
          citizenId,
          propertyId,
          billingMonth: 11,
          billingYear: 2026,
          dueDate: '2026-11-25T00:00:00.000Z',
          items: [],
        })
      ).rejects.toThrow(BadRequestError);
    });
  });
});

