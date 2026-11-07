export type PaymentGateway = 'ESEWA' | 'KHALTI' | 'CASH_COUNTER';

export type PaymentStatus = 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface PaymentInitiateDto {
  invoiceId: string;
  gateway: 'ESEWA' | 'KHALTI';
}

export interface PaymentInitiationResult {
  transactionReference: string;
  gateway: PaymentGateway;
  amount: number;
  paymentUrl?: string;
  formData?: Record<string, string>;
}

export interface EsewaVerifyDto {
  data: string;
}

export interface KhaltiVerifyDto {
  pidx: string;
  transaction_id?: string;
  amount?: number;
  purchase_order_id?: string;
}

export interface CashPaymentDto {
  invoiceId: string;
  receivedAmount: number;
  notes?: string;
}

export interface PaymentVerificationResult {
  isVerified: boolean;
  transactionReference: string;
  gatewayRefId: string;
  paidAmount: number;
  rawResponse: Record<string, unknown>;
  errorMessage?: string;
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

