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
import { toPaisa, toNpr, roundNpr } from '../../../shared/utils/currency.util.js';

interface KhaltiInitiateResponse {
  pidx?: string;
  payment_url?: string;
  expires_at?: string;
  expires_in?: number;
  detail?: string;
}

interface KhaltiLookupResponse {
  pidx?: string;
  total_amount?: number; // In Paisa
  status?: string; // 'Completed' | 'Pending' | 'User canceled' | 'Expired'
  transaction_id?: string;
  fee?: number;
  refunded?: boolean;
  purchase_order_id?: string;
  purchase_order_name?: string;
  detail?: string;
}

export class KhaltiProvider implements IPaymentProvider {
  public readonly gateway = PaymentGateway.KHALTI;

  public async initiatePayment(
    params: PaymentInitiationParams
  ): Promise<PaymentInitiationResult> {
    const totalNpr = roundNpr(Number(params.invoice.totalAmount));
    const amountInPaisa = toPaisa(totalNpr);

    const returnUrl = `${env.APP_FRONTEND_URL}/payment/khalti/callback`;
    const initiateUrl = new URL('initiate/', env.KHALTI_GATEWAY_URL).toString();

    const requestBody = {
      return_url: returnUrl,
      website_url: env.APP_FRONTEND_URL,
      amount: amountInPaisa,
      purchase_order_id: params.transactionReference,
      purchase_order_name: `Waste Collection Fee - Invoice ${params.invoice.id.slice(0, 8)}`,
      customer_info: {
        name: params.payer.email.split('@')[0] || 'WasteWise Citizen',
        email: params.payer.email,
      },
    };

    let response: Response;
    try {
      response = await fetch(initiateUrl, {
        method: 'POST',
        headers: {
          Authorization: `Key ${env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    } catch (err) {
      throw new BadRequestError(`Khalti payment gateway connection failed: ${(err as Error).message}`);
    }

    const data = (await response.json()) as KhaltiInitiateResponse;

    if (!response.ok || !data.pidx || !data.payment_url) {
      throw new BadRequestError(
        data.detail || 'Failed to initiate Khalti payment session (invalid gateway response)'
      );
    }

    return {
      transactionReference: params.transactionReference,
      gateway: this.gateway,
      amount: totalNpr,
      paymentUrl: data.payment_url,
      gatewayRefId: data.pidx,
    };
  }

  public async verifyPayment(
    params: PaymentVerificationParams
  ): Promise<PaymentVerificationResult> {
    const rawPayload = params.payload as {
      pidx?: string;
      transactionReference?: string;
      purchase_order_id?: string;
    };
    const pidx = rawPayload?.pidx;

    if (!pidx || typeof pidx !== 'string') {
      throw new BadRequestError('Missing or invalid Khalti transaction pidx in callback payload');
    }

    const lookupUrl = new URL('lookup/', env.KHALTI_GATEWAY_URL).toString();

    let response: Response;
    try {
      response = await fetch(lookupUrl, {
        method: 'POST',
        headers: {
          Authorization: `Key ${env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx }),
      });
    } catch (err) {
      throw new BadRequestError(`Khalti lookup verification failed: ${(err as Error).message}`);
    }

    const data = (await response.json()) as KhaltiLookupResponse;

    const resolvedTxRef =
      data.purchase_order_id ||
      rawPayload?.purchase_order_id ||
      rawPayload?.transactionReference ||
      '';

    if (!response.ok) {
      return {
        isVerified: false,
        transactionReference: resolvedTxRef,
        gatewayRefId: pidx,
        paidAmount: 0,
        rawResponse: data as Record<string, unknown>,
        errorMessage: data.detail || 'Khalti server-to-server lookup verification rejected',
      };
    }

    const isCompleted = data.status === 'Completed';
    const paidNpr = data.total_amount ? toNpr(data.total_amount) : 0;

    return {
      isVerified: isCompleted,
      transactionReference: resolvedTxRef,
      gatewayRefId: pidx,
      paidAmount: paidNpr,
      rawResponse: data as Record<string, unknown>,
      ...(!isCompleted ? { errorMessage: `Khalti payment is not completed (status: ${data.status})` } : {}),
    };
  }
}

