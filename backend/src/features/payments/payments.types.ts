import type {
  Payment,
  PaymentGateway,
  PaymentStatus,
  Invoice,
  User,
} from '@prisma/client';
import type { UserContext } from '../../shared/types/user-context.types.js';

export interface PaymentInitiationParams {
  tenantId: string;
  invoice: Invoice;
  payer: UserContext;
  transactionReference: string;
}

export interface PaymentInitiationResult {
  transactionReference: string;
  gateway: PaymentGateway;
  amount: number;
  paymentUrl?: string;
  formData?: Record<string, string>;
  gatewayRefId?: string;
}

export interface PaymentVerificationParams {
  tenantId: string;
  payload: unknown;
}

export interface PaymentVerificationResult {
  isVerified: boolean;
  transactionReference: string;
  gatewayRefId: string;
  paidAmount: number;
  rawResponse: Record<string, unknown>;
  errorMessage?: string;
}

export interface IPaymentProvider {
  readonly gateway: PaymentGateway;
  initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult>;
  verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResult>;
}

export interface SettlePaymentParams {
  tenantId: string;
  transactionReference: string;
  gatewayRefId: string;
  paidAmount: number;
  rawResponse: Record<string, unknown>;
}

export interface CashCounterPaymentData {
  tenantId: string;
  invoiceId: string;
  payerId: string;
  cashierUserId: string;
  receivedAmount: number;
  notes?: string | null;
}

export interface PaymentReceiptDto {
  receiptNumber: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  payerName: string;
  payerPhone: string;
  collectedByName?: string | null;
  paidAt: string;
}

export type PaymentWithRelations = Payment & {
  invoice: Invoice;
  payer: Pick<User, 'id' | 'fullName' | 'email' | 'phone'>;
  collectedBy?: Pick<User, 'id' | 'fullName'> | null;
};

export interface IPaymentsRepository {
  createInitiatedPayment(data: {
    tenantId: string;
    invoiceId: string;
    payerId: string;
    paymentGateway: PaymentGateway;
    amount: number;
    transactionReference: string;
  }): Promise<Payment>;

  findPaymentByReference(
    tenantId: string,
    transactionReference: string
  ): Promise<PaymentWithRelations | null>;

  findPaymentById(tenantId: string, paymentId: string): Promise<PaymentWithRelations | null>;

  findPaymentByReferenceGlobal(reference: string): Promise<Payment | null>;

  updateGatewayRefId(
    tenantId: string,
    paymentId: string,
    gatewayRefId: string
  ): Promise<Payment>;

  settlePaymentAtomic(params: SettlePaymentParams): Promise<{
    payment: PaymentWithRelations;
    alreadySettled: boolean;
  }>;

  recordCashPayment(data: CashCounterPaymentData): Promise<PaymentWithRelations>;

  getNextReceiptSequence(
    tenantId: string,
    year: number,
    month: number,
    tx?: unknown
  ): Promise<number>;
}

