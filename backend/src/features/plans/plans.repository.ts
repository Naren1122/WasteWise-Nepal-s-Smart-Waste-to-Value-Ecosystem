import { prisma } from '../../shared/database/prisma.service.js';
import type { Prisma } from '@prisma/client';
import type {
  IPlansRepository,
  CreateServicePlanData,
  UpdateServicePlanData,
  ServicePlanFilterParams,
  CreateSubscriptionData,
  ServicePlanWithRelations,
  SubscriptionWithRelations,
} from './plans.types.js';

const subscriptionInclude = {
  plan: true,
  property: {
    select: {
      id: true,
      streetAddress: true,
      houseNumber: true,
      propertyType: true,
      ward: { select: { wardNumber: true } },
    },
  },
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
    },
  },
} as const;

export class PlansRepository implements IPlansRepository {
  public async createPlan(data: CreateServicePlanData): Promise<ServicePlanWithRelations> {
    return prisma.servicePlan.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        code: data.code,
        description: data.description ?? null,
        propertyType: data.propertyType,
        wasteType: data.wasteType,
        monthlyRateNpr: data.monthlyRateNpr,
        isActive: data.isActive ?? true,
      },
      include: { _count: { select: { subscriptions: true } } },
    });
  }

  public async findPlanById(tenantId: string, id: string): Promise<ServicePlanWithRelations | null> {
    return prisma.servicePlan.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { subscriptions: true } } },
    });
  }

  public async findPlanByCode(tenantId: string, code: string): Promise<ServicePlanWithRelations | null> {
    return prisma.servicePlan.findFirst({
      where: { tenantId, code },
      include: { _count: { select: { subscriptions: true } } },
    });
  }

  public async findPlans(
    tenantId: string,
    filter: ServicePlanFilterParams
  ): Promise<{ plans: ServicePlanWithRelations[]; totalCount: number }> {
    const where: Prisma.ServicePlanWhereInput = { tenantId };

    if (filter.propertyType) where.propertyType = filter.propertyType;
    if (filter.wasteType) where.wasteType = filter.wasteType;
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 8;

    const [plans, totalCount] = await Promise.all([
      prisma.servicePlan.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ isActive: 'desc' }, { monthlyRateNpr: 'asc' }],
        include: { _count: { select: { subscriptions: true } } },
      }),
      prisma.servicePlan.count({ where }),
    ]);

    return { plans, totalCount };
  }

  public async updatePlan(
    tenantId: string,
    id: string,
    data: UpdateServicePlanData
  ): Promise<ServicePlanWithRelations> {
    return prisma.servicePlan.update({
      where: { id, tenantId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.monthlyRateNpr !== undefined && { monthlyRateNpr: data.monthlyRateNpr }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { _count: { select: { subscriptions: true } } },
    });
  }

  public async deletePlan(tenantId: string, id: string): Promise<void> {
    await prisma.servicePlan.delete({
      where: { id, tenantId },
    });
  }

  public async createSubscription(data: CreateSubscriptionData): Promise<SubscriptionWithRelations> {
    return prisma.subscription.create({
      data: {
        tenantId: data.tenantId,
        propertyId: data.propertyId,
        planId: data.planId,
        userId: data.userId,
        startDate: data.startDate ?? new Date(),
        status: 'ACTIVE',
      },
      include: subscriptionInclude,
    });
  }

  public async findSubscriptionById(
    tenantId: string,
    id: string
  ): Promise<SubscriptionWithRelations | null> {
    return prisma.subscription.findFirst({
      where: { id, tenantId },
      include: subscriptionInclude,
    });
  }

  public async findSubscriptionsByProperty(
    tenantId: string,
    propertyId: string
  ): Promise<SubscriptionWithRelations[]> {
    return prisma.subscription.findMany({
      where: { tenantId, propertyId },
      orderBy: { createdAt: 'desc' },
      include: subscriptionInclude,
    });
  }

  public async findActiveSubscription(
    tenantId: string,
    propertyId: string
  ): Promise<SubscriptionWithRelations | null> {
    return prisma.subscription.findFirst({
      where: { tenantId, propertyId, status: 'ACTIVE' },
      include: subscriptionInclude,
    });
  }

  public async cancelSubscription(
    tenantId: string,
    id: string
  ): Promise<SubscriptionWithRelations> {
    return prisma.subscription.update({
      where: { id, tenantId },
      data: { status: 'CANCELLED', endDate: new Date() },
      include: subscriptionInclude,
    });
  }
}

