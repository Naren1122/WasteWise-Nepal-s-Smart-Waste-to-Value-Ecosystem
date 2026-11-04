import { BulkyWasteStatus } from '@prisma/client';

export const MAX_BULKY_QUOTE_NPR = 50_000;
export const NEPAL_TIMEZONE = 'Asia/Kathmandu';

export const BULKY_WASTE_TRANSITIONS: Record<BulkyWasteStatus, BulkyWasteStatus[]> = {
  [BulkyWasteStatus.SUBMITTED]: [
    BulkyWasteStatus.QUOTED,
    BulkyWasteStatus.REJECTED,
    BulkyWasteStatus.CANCELLED,
  ],
  [BulkyWasteStatus.QUOTED]: [
    BulkyWasteStatus.QUOTED,
    BulkyWasteStatus.APPROVED,
    BulkyWasteStatus.REJECTED,
    BulkyWasteStatus.CANCELLED,
  ],
  [BulkyWasteStatus.APPROVED]: [
    BulkyWasteStatus.SCHEDULED,
    BulkyWasteStatus.CANCELLED,
  ],
  [BulkyWasteStatus.SCHEDULED]: [
    BulkyWasteStatus.SCHEDULED,
    BulkyWasteStatus.COMPLETED,
    BulkyWasteStatus.CANCELLED,
  ],
  [BulkyWasteStatus.COMPLETED]: [],
  [BulkyWasteStatus.REJECTED]: [],
  [BulkyWasteStatus.CANCELLED]: [],
};

