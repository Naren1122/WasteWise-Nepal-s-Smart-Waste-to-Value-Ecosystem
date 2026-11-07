import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentsService } from '../payments.service.js';
import type { IPaymentsRepository, PaymentWithRelations } from '../payments.types.js';
import type { IBillingRepository, InvoiceWithRelations } from '../../billing/billing.types.js';
import { PaymentProviderFactory } from '../payments.factory.js';
import { PaymentGateway, Role, InvoiceStatus, PropertyType, PropertyStatus } from '@prisma/client';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../../../shared/errors/app-error.js';
import { Decimal } from '@prisma/client/runtime/library';

describe('PaymentsService', () => {
  let mockPaymentsRepo: IPaymentsRepository;
  let mockBillingRepo: IBillingRepository;
  let service: PaymentsService;

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const citizenId = '00000000-0000-0000-0000-000000000002';
  const otherCitizenId = '00000000-0000-0000-0000-000000000099';
  const invoiceId = '00000000-0000-0000-0000-000000000003';
  const paymentId = '00000000-0000-0000-0000-000000000004';

  const mockInvoice: InvoiceWithRelations = {
    id: invoiceId,
    tenantId,
    citizenId,
    propertyId: 'prop-1',
    subscriptionId: null,
    bulkyWasteRequestId: null,
    invoiceNumber: 'INV-202611-001',
    billingMonth: 11,
    billingYear: 2026,
    subtotalAmount: new Decimal(500),
    discountAmount: new Decimal(0),
    taxAmount: new Decimal(0),
    totalAmount: new Decimal(500),
    status: InvoiceStatus.ISSUED,
    dueDate: new Date(),
    paidAt: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    citizen: {
      id: citizenId,
      fullName: 'Ram Bahadur',
      email: 'ram@kathmandu.gov.np',
      phone: '+9779851000001',
    },
    property: {
      id: 'prop-1',
      tenantId,
      wardId: 'ward-1',
      zoneId: null,
      userId: citizenId,
      propertyType: PropertyType.RESIDENTIAL,
      status: PropertyStatus.ACTIVE,
      houseNumber: '1',
      streetAddress: 'Street 1',
      latitude: 27.7,
      longitude: 85.3,
      qrCode: null,
      contactName: 'Ram',
      contactPhone: '9851000001',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    items: [],
  };

  const mockPayment: PaymentWithRelations = {
    id: paymentId,
    tenantId,
    invoiceId,
    payerId: citizenId,
    collectedByUserId: null,
    paymentGateway: PaymentGateway.ESEWA,
    status: 'SUCCESS',
    amount: new Decimal(500),
    currency: 'NPR',
    transactionReference: 'TX-REF-1',
    gatewayRefId: 'REF-1',
    gatewayResponse: null,
    receiptNumber: 'REC-202611-00001',
    paidAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    invoice: mockInvoice,
    payer: {
      id: citizenId,
      fullName: 'Ram Bahadur',
      email: 'ram@kathmandu.gov.np',
      phone: '+9779851000001',
    },
    collectedBy: null,
  };

  beforeEach(() => {
    mockPaymentsRepo = {
      createInitiatedPayment: vi.fn(),
      findPaymentByReference: vi.fn(),
      findPaymentById: vi.fn(),
      settlePaymentAtomic: vi.fn(),
      recordCashPayment: vi.fn(),
      getNextReceiptSequence: vi.fn(),
    };
    mockBillingRepo = {
      findInvoices: vi.fn(),
      findInvoicesByCitizen: vi.fn(),
      findInvoiceById: vi.fn(),
      createInvoice: vi.fn(),
      updateInvoiceStatus: vi.fn(),
      checkExistingMonthlyInvoice: vi.fn(),
      findActiveSubscriptionsForBilling: vi.fn(),
      getNextInvoiceSequence: vi.fn(),
    };

    service = new PaymentsService(mockPaymentsRepo, mockBillingRepo);
  });

  describe('initiatePayment', () => {
    it('should create initiated payment ledger record and return gateway payload', async () => {
      vi.mocked(mockBillingRepo.findInvoiceById).mockResolvedValue(mockInvoice);
      vi.mocked(mockPaymentsRepo.createInitiatedPayment).mockResolvedValue({} as any);

      const mockProvider = {
        gateway: PaymentGateway.ESEWA,
        initiatePayment: vi.fn().mockResolvedValue({
          transactionReference: 'TX-REF-1',
          gateway: PaymentGateway.ESEWA,
          amount: 500,
          formData: { product_code: 'EPAYTEST' },
        }),
        verifyPayment: vi.fn(),
      };
      vi.spyOn(PaymentProviderFactory, 'get').mockReturnValue(mockProvider);

      const result = await service.initiatePayment(
        tenantId,
        { id: citizenId, email: 'ram@kathmandu.gov.np', role: Role.CITIZEN },
        invoiceId,
        PaymentGateway.ESEWA
      );

      expect(result.gateway).toBe(PaymentGateway.ESEWA);
      expect(result.amount).toBe(500);
      expect(mockPaymentsRepo.createInitiatedPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          invoiceId,
          payerId: citizenId,
          amount: 500,
        })
      );
    });

    it('should throw ConflictError if invoice is already PAID', async () => {
      vi.mocked(mockBillingRepo.findInvoiceById).mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.PAID,
      });

      await expect(
        service.initiatePayment(
          tenantId,
          { id: citizenId, email: 'ram@kathmandu.gov.np', role: Role.CITIZEN },
          invoiceId,
          PaymentGateway.ESEWA
        )
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ForbiddenError if citizen attempts to pay another citizen invoice', async () => {
      vi.mocked(mockBillingRepo.findInvoiceById).mockResolvedValue(mockInvoice);

      await expect(
        service.initiatePayment(
          tenantId,
          { id: otherCitizenId, email: 'other@kathmandu.gov.np', role: Role.CITIZEN },
          invoiceId,
          PaymentGateway.ESEWA
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('verifyAndSettle', () => {
    it('should verify payment through provider strategy and execute atomic settlement', async () => {
      const mockProvider = {
        gateway: PaymentGateway.ESEWA,
        initiatePayment: vi.fn(),
        verifyPayment: vi.fn().mockResolvedValue({
          isVerified: true,
          transactionReference: 'TX-REF-1',
          gatewayRefId: 'GW-REF-99',
          paidAmount: 500,
          rawResponse: { status: 'COMPLETE' },
        }),
      };
      vi.spyOn(PaymentProviderFactory, 'get').mockReturnValue(mockProvider);

      vi.mocked(mockPaymentsRepo.settlePaymentAtomic).mockResolvedValue({
        payment: mockPayment,
        alreadySettled: false,
      });

      const result = await service.verifyAndSettle(tenantId, PaymentGateway.ESEWA, { data: 'xyz' });

      expect(result.isDuplicateCallback).toBe(false);
      expect(result.payment.receiptNumber).toBe('REC-202611-00001');
      expect(mockPaymentsRepo.settlePaymentAtomic).toHaveBeenCalledWith({
        tenantId,
        transactionReference: 'TX-REF-1',
        gatewayRefId: 'GW-REF-99',
        paidAmount: 500,
        rawResponse: { status: 'COMPLETE' },
      });
    });

    it('should throw BadRequestError when gateway verification fails', async () => {
      const mockProvider = {
        gateway: PaymentGateway.ESEWA,
        initiatePayment: vi.fn(),
        verifyPayment: vi.fn().mockResolvedValue({
          isVerified: false,
          errorMessage: 'HMAC signature mismatch',
        }),
      };
      vi.spyOn(PaymentProviderFactory, 'get').mockReturnValue(mockProvider);

      await expect(
        service.verifyAndSettle(tenantId, PaymentGateway.ESEWA, { data: 'tampered' })
      ).rejects.toThrow(BadRequestError);

      expect(mockPaymentsRepo.settlePaymentAtomic).not.toHaveBeenCalled();
    });
  });

  describe('recordCashCounterPayment', () => {
    it('should record over-the-counter cash payment and generate receipt', async () => {
      vi.mocked(mockBillingRepo.findInvoiceById).mockResolvedValue(mockInvoice);
      vi.mocked(mockPaymentsRepo.recordCashPayment).mockResolvedValue({
        ...mockPayment,
        paymentGateway: PaymentGateway.CASH_COUNTER,
        collectedBy: { id: 'cashier-1', fullName: 'Shyam Shrestha' },
      });

      const receipt = await service.recordCashCounterPayment(
        tenantId,
        { id: 'cashier-1', email: 'cashier@kathmandu.gov.np', role: Role.WARD_OFFICER },
        invoiceId,
        500
      );

      expect(receipt.gateway).toBe(PaymentGateway.CASH_COUNTER);
      expect(receipt.collectedByName).toBe('Shyam Shrestha');
      expect(mockPaymentsRepo.recordCashPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          invoiceId,
          cashierUserId: 'cashier-1',
          receivedAmount: 500,
        })
      );
    });
  });

  describe('getPaymentReceipt', () => {
    it('should return receipt DTO when caller is authorized', async () => {
      vi.mocked(mockPaymentsRepo.findPaymentById).mockResolvedValue(mockPayment);

      const receipt = await service.getPaymentReceipt(tenantId, paymentId, {
        id: citizenId,
        role: Role.CITIZEN,
      });

      expect(receipt.paymentId).toBe(paymentId);
      expect(receipt.amount).toBe(500);
    });

    it('should throw ForbiddenError if citizen requests another user receipt', async () => {
      vi.mocked(mockPaymentsRepo.findPaymentById).mockResolvedValue(mockPayment);

      await expect(
        service.getPaymentReceipt(tenantId, paymentId, {
          id: otherCitizenId,
          role: Role.CITIZEN,
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });
});

