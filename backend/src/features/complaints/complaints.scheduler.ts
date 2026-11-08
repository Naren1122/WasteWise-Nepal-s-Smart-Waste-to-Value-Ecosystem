import { prisma } from '../../shared/database/prisma.service.js';

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // Check every 15 minutes
const AUTO_CLOSE_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

export class ComplaintsScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  public start(): void {
    // Initial run after 1 minute of server startup, then recurring
    this.timer = setTimeout(() => {
      void this.runMaintenance();
      this.timer = setInterval(() => {
        void this.runMaintenance();
      }, CHECK_INTERVAL_MS);
    }, 60_000);

    console.log('[ComplaintsScheduler] Initialized SLA breach and auto-closure maintenance scheduler');
  }

  public stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[ComplaintsScheduler] Stopped maintenance scheduler');
  }

  public async runMaintenance(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const now = new Date();
      await this.detectSlaBreaches(now);
      await this.autoCloseResolvedComplaints(now);
    } catch (error) {
      console.error('[ComplaintsScheduler] Maintenance cycle encountered an error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  public async detectSlaBreaches(now: Date): Promise<number> {
    const breached = await prisma.complaint.findMany({
      where: {
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'] },
        isSlaBreached: false,
        slaDeadline: { lt: now },
      },
      select: { id: true, ticketNumber: true, citizenId: true },
      take: 50,
    });

    if (breached.length === 0) return 0;

    for (const item of breached) {
      await prisma.$transaction(async (tx) => {
        await tx.complaint.update({
          where: { id: item.id },
          data: { isSlaBreached: true },
        });

        await tx.complaintTimeline.create({
          data: {
            complaintId: item.id,
            toStatus: 'ASSIGNED',
            action: 'SLA_BREACHED',
            notes: 'Resolution deadline passed; escalated to municipal oversight',
            performedById: item.citizenId,
          },
        });
      });
    }

    console.log(`[ComplaintsScheduler] Marked ${breached.length} complaints as SLA breached`);
    return breached.length;
  }

  public async autoCloseResolvedComplaints(now: Date): Promise<number> {
    const threshold = new Date(now.getTime() - AUTO_CLOSE_WINDOW_MS);
    const resolvable = await prisma.complaint.findMany({
      where: {
        status: 'RESOLVED',
        resolvedAt: { lte: threshold },
      },
      select: { id: true, ticketNumber: true, citizenId: true },
      take: 50,
    });

    if (resolvable.length === 0) return 0;

    for (const item of resolvable) {
      await prisma.$transaction(async (tx) => {
        await tx.complaint.update({
          where: { id: item.id },
          data: {
            status: 'CLOSED',
            closedAt: now,
          },
        });

        await tx.complaintTimeline.create({
          data: {
            complaintId: item.id,
            fromStatus: 'RESOLVED',
            toStatus: 'CLOSED',
            action: 'AUTO_CLOSED',
            notes: 'Ticket auto-closed after 48-hour dispute grace period',
            performedById: item.citizenId,
          },
        });
      });
    }

    console.log(`[ComplaintsScheduler] Auto-closed ${resolvable.length} resolved complaints`);
    return resolvable.length;
  }
}

export const complaintsScheduler = new ComplaintsScheduler();

