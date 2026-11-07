import crypto from 'node:crypto';
import type {
  IPaymentProvider,
  PaymentInitiationParams,
  PaymentInitiationResult,
  PaymentVerificationParams,
  PaymentVerificationResult,
} from '../payments.types.js';
import { PaymentGateway } from '@prisma/client';
import { env } from '../../../shared/config/env.js';
import { BadRequestError } from '../../../shared/errors/app-error.js';
import { roundNpr } from '../../../shared/utils/currency.util.js';

interface DecodedEsewaResponse {
  transaction_code?: string;
  status?: string;
  total_amount?: string | number;
  transaction_uuid?: string;
  product_code?: string;
  signed_field_names?: string;
  signature?: string;
}

export class EsewaProvider implements IPaymentProvider {
  public readonly gateway = PaymentGateway.ESEWA;

  /**
   * Generates HMAC-SHA256 signature for eSewa ePay v2.
   * Signature message string format: "total_amount=X,transaction_uuid=Y,product_code=Z"
   */
  public generateSignature(totalAmount: string, transactionUuid: string, productCode: string): string {
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    return crypto
      .createHmac('sha256', env.ESEWA_SECRET_KEY)
      .update(message)
      .digest('base64');
  }

  public async initiatePayment(
    params: PaymentInitiationParams
  ): Promise<PaymentInitiationResult> {
    const totalAmount = roundNpr(Number(params.invoice.totalAmount)).toFixed(2);
    const transactionUuid = params.transactionReference;
    const productCode = env.ESEWA_PRODUCT_CODE;

    const signature = this.generateSignature(totalAmount, transactionUuid, productCode);

    const successUrl = `${env.APP_FRONTEND_URL}/payment/esewa/callback`;
    const failureUrl = `${env.APP_FRONTEND_URL}/payment/failure`;

    const formData: Record<string, string> = {
      amount: totalAmount,
      tax_amount: '0',
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: successUrl,
      failure_url: failureUrl,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature,
    };

    return {
      transactionReference: transactionUuid,
      gateway: this.gateway,
      amount: Number(totalAmount),
      paymentUrl: env.ESEWA_GATEWAY_URL,
      formData,
    };
  }

  public async verifyPayment(
    params: PaymentVerificationParams
  ): Promise<PaymentVerificationResult> {
    const rawPayload = params.payload as { data?: string };
    if (!rawPayload?.data || typeof rawPayload.data !== 'string') {
      throw new BadRequestError('Missing or invalid eSewa callback payload (encoded data string required)');
    }

    let decoded: DecodedEsewaResponse;
    try {
      const decodedJson = Buffer.from(rawPayload.data, 'base64').toString('utf-8');
      decoded = JSON.parse(decodedJson) as DecodedEsewaResponse;
    } catch {
      throw new BadRequestError('Failed to decode eSewa base64 payload');
    }

    const {
      transaction_code,
      status,
      total_amount,
      transaction_uuid,
      product_code,
      signature,
    } = decoded;

    if (!transaction_uuid || !total_amount || !signature) {
      throw new BadRequestError('Incomplete eSewa transaction parameters in decoded payload');
    }

    // Defensive Integrity Check: Recompute HMAC-SHA256 signature
    const formattedAmount = typeof total_amount === 'number' ? total_amount.toFixed(2) : total_amount;
    const expectedSignature = this.generateSignature(
      formattedAmount,
      transaction_uuid,
      product_code || env.ESEWA_PRODUCT_CODE
    );

    if (signature !== expectedSignature) {
      return {
        isVerified: false,
        transactionReference: transaction_uuid,
        gatewayRefId: transaction_code ?? '',
        paidAmount: Number(total_amount),
        rawResponse: decoded as Record<string, unknown>,
        errorMessage: 'Security violation: eSewa HMAC-SHA256 signature verification failed (data tampered)',
      };
    }

    if (status !== 'COMPLETE') {
      return {
        isVerified: false,
        transactionReference: transaction_uuid,
        gatewayRefId: transaction_code ?? '',
        paidAmount: Number(total_amount),
        rawResponse: decoded as Record<string, unknown>,
        errorMessage: `eSewa transaction not complete (status: ${status})`,
      };
    }

    // Secondary Server-to-Server Verification
    let serverStatusVerified = true;
    try {
      const statusCheckUrl = `${env.ESEWA_STATUS_URL}?product_code=${encodeURIComponent(
        product_code || env.ESEWA_PRODUCT_CODE
      )}&total_amount=${encodeURIComponent(formattedAmount)}&transaction_uuid=${encodeURIComponent(
        transaction_uuid
      )}`;

      const response = await fetch(statusCheckUrl, { method: 'GET' });
      if (response.ok) {
        const statusJson = (await response.json()) as { status?: string };
        if (statusJson.status !== 'COMPLETE') {
          serverStatusVerified = false;
        }
      }
    } catch (err) {
      console.warn('[EsewaProvider] Server-to-server status check network warning (falling back to verified signature):', err);
    }

    return {
      isVerified: serverStatusVerified,
      transactionReference: transaction_uuid,
      gatewayRefId: transaction_code ?? transaction_uuid,
      paidAmount: Number(total_amount),
      rawResponse: decoded as Record<string, unknown>,
      ...(!serverStatusVerified ? { errorMessage: 'eSewa server-to-server status check failed' } : {}),
    };
  }
}

