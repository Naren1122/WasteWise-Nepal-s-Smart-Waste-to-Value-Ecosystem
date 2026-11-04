import { PlansRepository } from './plans.repository.js';
import { PropertyRepository } from '../properties/properties.repository.js';
import type {
  IPlansRepository,
  ServicePlanDto,
  ServicePlanFilterParams,
  SubscriptionDto,
  ServicePlanWithRelations,
  SubscriptionWithRelations,
} from './plans.types.js';
import type {
  CreateServicePlanInput,
  UpdateServicePlanInput,
  CreateSubscriptionInput,
} from './plans.schema.js';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '../../shared/errors/app-error.js';
import { Role } from '@prisma/client';

export class PlansService {
  constructor(
    private readonly repo: IPlansRepository = new PlansRepository(),
    private readonly propertyRepo = new PropertyRepository()
  ) {}

  public async createPlan(tenantId: string, dto: CreateServicePlanInput): Promise<ServicePlanDto> {
    const existing = await this.repo.findPlanByCode(tenantId, dto.code);
    if (existing) {
      throw new ConflictError(`Service plan with code '${dto.code}' already exists`);
    }

    const plan = await this.repo.createPlan({
      tenantId,
      name: dto.name,
      code: dto.code,
      description: dto.description ?? null,
      propertyType: dto.propertyType,
      wasteType: dto.wasteType,
      monthlyRateNpr: dto.monthlyRateNpr,
      isActive: dto.isActive ?? true,
    });

    return this.toPlanDto(plan);
  }

  public async getPlanById(tenantId: string, id: string): Promise<ServicePlanDto> {
    const plan = await this.repo.findPlanById(tenantId, id);
    if (!plan) {
      throw new NotFoundError('Service plan', id);
    }
    return this.toPlanDto(plan);
  }

  public async getPlans(
    tenantId: string,
    filter: ServicePlanFilterParams
  ): Promise<{ items: ServicePlanDto[]; totalCount: number }> {
    const { plans, totalCount } = await this.repo.findPlans(tenantId, filter);
    return {
      items: plans.map((p) => this.toPlanDto(p)),
      totalCount,
    };
  }

  public async updatePlan(
    tenantId: string,
    id: string,
    dto: UpdateServicePlanInput
  ): Promise<ServicePlanDto> {
    await this.getPlanById(tenantId, id);
    const updated = await this.repo.updatePlan(tenantId, id, dto);
    return this.toPlanDto(updated);
  }

  public async createSubscription(
    tenantId: string,
    userId: string,
    userRole: Role,
    dto: CreateSubscriptionInput
  ): Promise<SubscriptionDto> {
    const property = await this.propertyRepo.findPropertyById(tenantId, dto.propertyId);
    if (!property) {
      throw new NotFoundError('Property', dto.propertyId);
    }

    if (userRole === Role.CITIZEN && property.userId !== userId) {
      throw new ForbiddenError('You can only subscribe plans for your own properties');
    }

    const plan = await this.repo.findPlanById(tenantId, dto.planId);
    if (!plan) {
      throw new NotFoundError('Service plan', dto.planId);
    }
    if (!plan.isActive) {
      throw new ValidationError({ planId: ['Cannot subscribe to an inactive service plan'] });
    }
    if (plan.propertyType !== property.propertyType) {
      throw new ValidationError({
        planId: [`Plan type '${plan.propertyType}' does not match property type '${property.propertyType}'`],
      });
    }

    const existingActive = await this.repo.findActiveSubscription(tenantId, dto.propertyId);
    if (existingActive && existingActive.plan.wasteType === plan.wasteType) {
      throw new ConflictError(
        `Property already has an active subscription for ${plan.wasteType} waste stream`
      );
    }

    const sub = await this.repo.createSubscription({
      tenantId,
      propertyId: dto.propertyId,
      planId: dto.planId,
      userId,
      startDate: dto.startDate,
    });

    return this.toSubscriptionDto(sub);
  }

  public async getPropertySubscriptions(
    tenantId: string,
    propertyId: string,
    userId: string,
    userRole: Role
  ): Promise<SubscriptionDto[]> {
    const property = await this.propertyRepo.findPropertyById(tenantId, propertyId);
    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    if (userRole === Role.CITIZEN && property.userId !== userId) {
      throw new ForbiddenError('Access denied to property subscriptions');
    }

    const subs = await this.repo.findSubscriptionsByProperty(tenantId, propertyId);
    return subs.map((s) => this.toSubscriptionDto(s));
  }

  public async cancelSubscription(
    tenantId: string,
    subscriptionId: string,
    userId: string,
    userRole: Role
  ): Promise<SubscriptionDto> {
    const sub = await this.repo.findSubscriptionById(tenantId, subscriptionId);
    if (!sub) {
      throw new NotFoundError('Subscription', subscriptionId);
    }

    if (userRole === Role.CITIZEN && sub.userId !== userId) {
      throw new ForbiddenError('You can only cancel your own subscriptions');
    }

    if (sub.status === 'CANCELLED') {
      throw new ValidationError({ subscriptionId: ['Subscription is already cancelled'] });
    }

    const cancelled = await this.repo.cancelSubscription(tenantId, subscriptionId);
    return this.toSubscriptionDto(cancelled);
  }

  private toPlanDto(p: ServicePlanWithRelations): ServicePlanDto {
    return {
      id: p.id,
      tenantId: p.tenantId,
      name: p.name,
      code: p.code,
      description: p.description,
      propertyType: p.propertyType,
      wasteType: p.wasteType,
      monthlyRateNpr: p.monthlyRateNpr,
      isActive: p.isActive,
      activeSubscriptionsCount: p._count?.subscriptions,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private toSubscriptionDto(s: SubscriptionWithRelations): SubscriptionDto {
    return {
      id: s.id,
      tenantId: s.tenantId,
      propertyId: s.propertyId,
      planId: s.planId,
      userId: s.userId,
      status: s.status,
      startDate: s.startDate,
      endDate: s.endDate,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      plan: s.plan ? {
        name: s.plan.name,
        code: s.plan.code,
        monthlyRateNpr: s.plan.monthlyRateNpr,
        wasteType: s.plan.wasteType,
      } : undefined,
      property: s.property ? {
        streetAddress: s.property.streetAddress,
        wardNumber: s.property.ward.wardNumber,
      } : undefined,
    };
  }
}

