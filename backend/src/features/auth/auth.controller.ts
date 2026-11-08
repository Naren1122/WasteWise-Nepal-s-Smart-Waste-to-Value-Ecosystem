import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  TenantOnboardSchema,
  CreateStaffSchema,
} from './auth.schema.js';
import { ApiResponse } from '../../shared/types/api-response.types.js';
import { AuthResponseDto, AuthTokens, UserProfileDto } from './auth.types.js';
import { BadRequestError } from '../../shared/errors/app-error.js';

export class AuthController {
  constructor(private readonly authService: AuthService = new AuthService()) {}

  public register = async (req: Request, res: Response): Promise<void> => {
    const validatedData = RegisterSchema.parse(req.body);
    let tenantId = req.tenant?.id || validatedData.tenantId;

    if (!tenantId && validatedData.subdomain) {
      const tenant = await this.authService.findTenantBySubdomain(validatedData.subdomain);
      tenantId = tenant?.id;
    }

    if (!tenantId) {
      throw new BadRequestError('Municipality is required for citizen registration. Please select a municipality.');
    }

    const result = await this.authService.register(tenantId, validatedData);

    const response: ApiResponse<AuthResponseDto> = {
      success: true,
      data: result,
      message: 'User registered successfully',
      meta: { timestamp: new Date().toISOString(), tenantId },
    };

    res.status(201).json(response);
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    const validatedData = LoginSchema.parse(req.body);
    const result = await this.authService.login(req.tenant?.id, validatedData);

    const response: ApiResponse<AuthResponseDto> = {
      success: true,
      data: result,
      message: 'Logged in successfully',
      meta: { timestamp: new Date().toISOString(), tenantId: result.tenant.id },
    };

    res.status(200).json(response);
  };

  public listPublicTenants = async (_req: Request, res: Response): Promise<void> => {
    const tenants = await this.authService.listPublicTenants();
    const response: ApiResponse<Array<{ id: string; name: string; subdomain: string; district: string; province: string }>> = {
      success: true,
      data: tenants,
      message: 'Active municipalities retrieved',
    };
    res.status(200).json(response);
  };

  public refreshTokens = async (req: Request, res: Response): Promise<void> => {
    const validatedData = RefreshTokenSchema.parse(req.body);
    const tokens = await this.authService.refreshTokens(validatedData.refreshToken);

    const response: ApiResponse<AuthTokens> = {
      success: true,
      data: tokens,
      message: 'Tokens refreshed successfully',
      meta: { timestamp: new Date().toISOString() },
    };

    res.status(200).json(response);
  };

  public createStaff = async (req: Request, res: Response): Promise<void> => {
    if (!req.tenant) {
      throw new BadRequestError('Tenant context required');
    }

    const validatedData = CreateStaffSchema.parse(req.body);
    const result = await this.authService.createStaff(req.tenant.id, validatedData);

    const response: ApiResponse<UserProfileDto> = {
      success: true,
      data: result,
      message: 'Staff member account created successfully',
      meta: { timestamp: new Date().toISOString(), tenantId: req.tenant.id },
    };

    res.status(201).json(response);
  };

  public onboardTenant = async (req: Request, res: Response): Promise<void> => {
    const validatedData = TenantOnboardSchema.parse(req.body);
    const result = await this.authService.onboardTenant(validatedData);

    const response: ApiResponse<AuthResponseDto> = {
      success: true,
      data: result,
      message: 'Municipality tenant and admin onboarded successfully',
      meta: { timestamp: new Date().toISOString(), tenantId: result.tenant.id },
    };

    res.status(201).json(response);
  };

  public getMe = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new BadRequestError('Authentication required');
    }

    const response: ApiResponse<typeof req.user> = {
      success: true,
      data: req.user,
      meta: { timestamp: new Date().toISOString(), tenantId: req.user.tenantId },
    };

    res.status(200).json(response);
  };
}

