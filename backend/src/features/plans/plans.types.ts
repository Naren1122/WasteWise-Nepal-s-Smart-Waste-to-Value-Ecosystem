import type { Prisma } from '@prisma/client';
import { PropertyType, WasteType, SubscriptionStatus, Role } from '@prisma/client';

export { PropertyType, WasteType, SubscriptionStatus, Role };

export type ServicePlanWithRelations = Prisma.ServicePlanGetPayload<{
  include: {
    _count: { select: { subscriptions: true } };
  };
}>;

export type SubscriptionWithRelations = Prisma.SubscriptionGetPayload<{
  include: {
    plan: true;
    property: {
      select: {
        id: true;
        streetAddress: true;
        houseNumber: true;
        propertyType: true;
        ward: { select: { wardNumber: true } };
      };
    };
    user: {
      select: {
        id: true;
        fullName: true;
        email: true;
        phone: true;
      };
    };
  };
}>;

export interface ServicePlanDto {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServicePlanData {
  tenantId: string;
  name: string;
  code: string;
  description?: string | null;
  propertyType: PropertyType;
  wasteType: WasteType;
  monthlyRateNpr: number;
  isActive?: boolean;
}

export interface UpdateServicePlanData {
  name?: string | undefined;
  description?: string | null | undefined;
  monthlyRateNpr?: number | undefined;
  isActive?: boolean | undefined;
}

export interface ServicePlanFilterParams {
  propertyType?: PropertyType | undefined;
  wasteType?: WasteType | undefined;
  isActive?: boolean | undefined;
  search?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface CreateSubscriptionData {
  tenantId: string;
  propertyId: string;
  planId: string;
  userId: string;
  startDate?: Date | undefined;
}

export interface SubscriptionDto {
  id: string;
  tenantId: string;
  propertyId: string;
  planId: string;
  userId: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  plan?: {
    name: string;
    code: string;
    monthlyRateNpr: number;
    wasteType: WasteType;
  } | undefined;
  property?: {
    streetAddress: string;
    wardNumber: number;
  } | undefined;
}

export interface IPlansRepository {
  createPlan(data: CreateServicePlanData): Promise<ServicePlanWithRelations>;
  findPlanById(tenantId: string, id: string): Promise<ServicePlanWithRelations | null>;
  findPlanByCode(tenantId: string, code: string): Promise<ServicePlanWithRelations | null>;
  findPlans(tenantId: string, filter: ServicePlanFilterParams): Promise<{ plans: ServicePlanWithRelations[]; totalCount: number }>;
  updatePlan(tenantId: string, id: string, data: UpdateServicePlanData): Promise<ServicePlanWithRelations>;
  createSubscription(data: CreateSubscriptionData): Promise<SubscriptionWithRelations>;
  findSubscriptionById(tenantId: string, id: string): Promise<SubscriptionWithRelations | null>;
  findSubscriptionsByProperty(tenantId: string, propertyId: string): Promise<SubscriptionWithRelations[]>;
  findActiveSubscription(tenantId: string, propertyId: string): Promise<SubscriptionWithRelations | null>;
  cancelSubscription(tenantId: string, id: string): Promise<SubscriptionWithRelations>;
  deletePlan(tenantId: string, id: string): Promise<void>;
}

