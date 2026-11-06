export type WasteType = 'ORGANIC' | 'RECYCLABLE' | 'HAZARDOUS' | 'BULKY';
export type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'INSTITUTIONAL';
export type PickupStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED';

export type BulkyWasteStatus =
  | 'SUBMITTED'
  | 'QUOTED'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface CollectionSchedule {
  id: string;
  tenantId: string;
  wardId: string;
  wardNumber: number;
  zoneId: string | null;
  zoneName: string | null;
  wasteType: WasteType;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePlan {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description: string | null;
  propertyType: PropertyType;
  wasteType: WasteType;
  monthlyRateNpr: number;
  isActive: boolean;
  activeSubscriptionsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BulkyWasteRequest {
  id: string;
  tenantId: string;
  propertyId: string;
  propertyAddress: string;
  wardNumber: number;
  userId: string;
  userName: string;
  userPhone: string;
  itemDescription: string;
  estimatedVolume: string | null;
  preferredDate: string;
  scheduledDate: string | null;
  status: BulkyWasteStatus;
  quotedAmountNpr: number | null;
  officerNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBulkyRequestInput {
  propertyId: string;
  itemDescription: string;
  estimatedVolume?: string | null;
  preferredDate: string;
}

export interface QuoteBulkyRequestInput {
  quotedAmountNpr: number;
  officerNotes?: string | null;
}

export interface ScheduleBulkyRequestInput {
  scheduledDate: string;
  officerNotes?: string | null;
}

export interface RejectBulkyRequestInput {
  officerNotes?: string;
  reason?: string;
}

export interface CreateServicePlanInput {
  name: string;
  code: string;
  description?: string | null;
  propertyType: PropertyType;
  wasteType: WasteType;
  monthlyRateNpr: number;
  isActive?: boolean;
}

export interface CreateSubscriptionInput {
  propertyId: string;
  planId: string;
  startDate?: string;
}

export interface CreateCollectionScheduleInput {
  wardId: string;
  zoneId?: string | null;
  wasteType: WasteType;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

export interface GeneratePickupsInput {
  targetDate: string;
  wardId?: string;
}

