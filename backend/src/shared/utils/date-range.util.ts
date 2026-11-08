import { DatePreset } from '../../features/analytics/analytics.schema.js';

export interface ResolvedDateRange {
  startDate: Date;
  endDate: Date;
  timezone: string;
}

const NEPAL_TIMEZONE = 'Asia/Kathmandu';
const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000; // +05:45 in milliseconds

/**
 * Converts a UTC Date to Nepal Time (NPT) Date representation
 */
export const toNepalTime = (date: Date = new Date()): Date => {
  return new Date(date.getTime() + NEPAL_OFFSET_MS);
};

/**
 * Returns start of day (00:00:00.000) in UTC matching Nepal date
 */
export const startOfNepalDay = (date: Date): Date => {
  const npt = toNepalTime(date);
  const startNpt = new Date(Date.UTC(npt.getUTCFullYear(), npt.getUTCMonth(), npt.getUTCDate(), 0, 0, 0, 0));
  return new Date(startNpt.getTime() - NEPAL_OFFSET_MS);
};

/**
 * Returns end of day (23:59:59.999) in UTC matching Nepal date
 */
export const endOfNepalDay = (date: Date): Date => {
  const npt = toNepalTime(date);
  const endNpt = new Date(Date.UTC(npt.getUTCFullYear(), npt.getUTCMonth(), npt.getUTCDate(), 23, 59, 59, 999));
  return new Date(endNpt.getTime() - NEPAL_OFFSET_MS);
};

/**
 * Resolves date filters (presets or custom dates) into standard UTC boundaries
 */
export const resolveDateRange = (params: {
  startDate?: string | undefined;
  endDate?: string | undefined;
  preset?: DatePreset | undefined;
}): ResolvedDateRange => {
  const now = new Date();

  if (params.startDate || params.endDate) {
    const rawStart = params.startDate ? new Date(params.startDate) : new Date(now.getTime() - 30 * 86400000);
    const rawEnd = params.endDate ? new Date(params.endDate) : now;

    return {
      startDate: startOfNepalDay(rawStart),
      endDate: endOfNepalDay(rawEnd),
      timezone: NEPAL_TIMEZONE,
    };
  }

  const preset = params.preset ?? 'this_month';
  const nptNow = toNepalTime(now);
  const year = nptNow.getUTCFullYear();
  const month = nptNow.getUTCMonth();
  const day = nptNow.getUTCDate();

  switch (preset) {
    case 'today':
      return {
        startDate: startOfNepalDay(now),
        endDate: endOfNepalDay(now),
        timezone: NEPAL_TIMEZONE,
      };

    case 'yesterday': {
      const yesterday = new Date(now.getTime() - 86400000);
      return {
        startDate: startOfNepalDay(yesterday),
        endDate: endOfNepalDay(yesterday),
        timezone: NEPAL_TIMEZONE,
      };
    }

    case 'this_week': {
      // Sunday as week start (standard in Nepal)
      const dayOfWeek = nptNow.getUTCDay();
      const startOfWeek = new Date(now.getTime() - dayOfWeek * 86400000);
      return {
        startDate: startOfNepalDay(startOfWeek),
        endDate: endOfNepalDay(now),
        timezone: NEPAL_TIMEZONE,
      };
    }

    case 'last_week': {
      const dayOfWeek = nptNow.getUTCDay();
      const endOfLastWeek = new Date(now.getTime() - (dayOfWeek + 1) * 86400000);
      const startOfLastWeek = new Date(endOfLastWeek.getTime() - 6 * 86400000);
      return {
        startDate: startOfNepalDay(startOfLastWeek),
        endDate: endOfNepalDay(endOfLastWeek),
        timezone: NEPAL_TIMEZONE,
      };
    }

    case 'this_month': {
      const startOfMonthNpt = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      return {
        startDate: new Date(startOfMonthNpt.getTime() - NEPAL_OFFSET_MS),
        endDate: endOfNepalDay(now),
        timezone: NEPAL_TIMEZONE,
      };
    }

    case 'last_month': {
      const startOfLastMonthNpt = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const endOfLastMonthNpt = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      return {
        startDate: new Date(startOfLastMonthNpt.getTime() - NEPAL_OFFSET_MS),
        endDate: new Date(endOfLastMonthNpt.getTime() - NEPAL_OFFSET_MS),
        timezone: NEPAL_TIMEZONE,
      };
    }

    case 'this_fiscal_year': {
      // Nepal fiscal year starts mid-July (approx Shrawan 1st, July 16)
      const fiscalYearStartYear = month >= 6 ? year : year - 1;
      const startFiscalNpt = new Date(Date.UTC(fiscalYearStartYear, 6, 16, 0, 0, 0, 0));
      return {
        startDate: new Date(startFiscalNpt.getTime() - NEPAL_OFFSET_MS),
        endDate: endOfNepalDay(now),
        timezone: NEPAL_TIMEZONE,
      };
    }

    case 'last_30_days':
    default: {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
      return {
        startDate: startOfNepalDay(thirtyDaysAgo),
        endDate: endOfNepalDay(now),
        timezone: NEPAL_TIMEZONE,
      };
    }
  }
};

