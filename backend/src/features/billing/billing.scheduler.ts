import { BillingService } from './billing.service.js';
import { prisma } from '../../shared/database/prisma.service.js';

/**
 * WasteWise Automated Recurring Invoicing Scheduler
 * Periodically verifies recurring subscription billing cycles and generates
 * monthly municipal waste collection invoices for all active property subscriptions.
 */
export class BillingScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(private readonly service: BillingService = new BillingService()) {}

  public start(): void {
    const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check hourly

    // Run first verification 2 minutes after server boot
    this.timer = setTimeout(() => {
      this.checkAndGenerateInvoices();
      this.timer = setInterval(() => this.checkAndGenerateInvoices(), CHECK_INTERVAL_MS);
    }, 120_000);

    console.log('[BillingScheduler] Initialized automated monthly recurring billing scheduler');
  }

  public async checkAndGenerateInvoices(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Fetch all active municipal tenants
      const tenants = await prisma.tenant.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });

      for (const tenant of tenants) {
        try {
          const summary = await this.service.generateMonthlyInvoices(
            tenant.id,
            currentMonth,
            currentYear
          );

          if (summary.invoicesCreated > 0) {
            console.log(
              `[BillingScheduler] Generated ${summary.invoicesCreated} invoices for ${tenant.name} (${currentYear}/${currentMonth})`
            );
          }
        } catch (tenantErr) {
          console.error(`[BillingScheduler] Error generating invoices for tenant ${tenant.id}:`, tenantErr);
        }
      }
    } catch (err) {
      console.error('[BillingScheduler] Error during recurring billing cycle:', err);
    } finally {
      this.isRunning = false;
    }
  }

  public stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const billingScheduler = new BillingScheduler();

