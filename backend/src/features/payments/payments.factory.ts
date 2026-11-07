import { PaymentGateway } from '@prisma/client';
import type { IPaymentProvider } from './payments.types.js';
import { EsewaProvider } from './providers/esewa.provider.js';
import { KhaltiProvider } from './providers/khalti.provider.js';
import { BadRequestError } from '../../shared/errors/app-error.js';

export class PaymentProviderFactory {
  private static providers: Map<PaymentGateway, IPaymentProvider> = new Map();
  private static isInitialized = false;

  private static initialize(): void {
    if (this.isInitialized) return;
    this.register(new EsewaProvider());
    this.register(new KhaltiProvider());
    this.isInitialized = true;
  }

  public static register(provider: IPaymentProvider): void {
    this.providers.set(provider.gateway, provider);
  }

  public static get(gateway: PaymentGateway): IPaymentProvider {
    this.initialize();
    const provider = this.providers.get(gateway);
    if (!provider) {
      throw new BadRequestError(`Unsupported or unconfigured payment gateway: ${gateway}`);
    }
    return provider;
  }
}

