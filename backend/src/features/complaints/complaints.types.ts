import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintAttachmentType,
  Role,
} from '@prisma/client';

export {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintAttachmentType,
};

export interface ComplaintAttachmentDto {
  id: string;
  attachmentType: ComplaintAttachmentType;
  fileUrl: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  uploadedById: string;
  createdAt: Date;
}

export interface ComplaintTimelineDto {
  id: string;
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  action: string;
  notes: string | null;
  performedById: string;
  performedByName?: string;
  createdAt: Date;
}

export interface ComplaintFeedbackDto {
  id: string;
  rating: number;
  comments: string | null;
  createdAt: Date;
}

export interface ComplaintDetailDto {
  id: string;
  tenantId: string;
  ticketNumber: string;
  wardId: string;
  wardNumber?: number;
  citizenId: string;
  citizenName?: string;
  citizenPhone?: string;
  assignedToId: string | null;
  assignedToName?: string | null;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  addressText: string | null;
  slaDeadline: Date;
  isSlaBreached: boolean;
  rejectionReason: string | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  attachments: ComplaintAttachmentDto[];
  timelines: ComplaintTimelineDto[];
  feedback: ComplaintFeedbackDto | null;
  subscriberCount?: number;
}

export interface ComplaintSummaryDto {
  id: string;
  ticketNumber: string;
  wardId: string;
  wardNumber?: number;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  title: string;
  latitude: number;
  longitude: number;
  slaDeadline: Date;
  isSlaBreached: boolean;
  createdAt: Date;
  resolvedAt: Date | null;
}

export interface LodgeComplaintDto {
  wardId: string;
  category: ComplaintCategory;
  priority?: ComplaintPriority;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  addressText?: string;
  attachments?: Array<{
    fileUrl: string;
    fileKey: string;
    mimeType: string;
    fileSize: number;
  }>;
}

export interface TriageComplaintDto {
  status: ComplaintStatus;
  priority?: ComplaintPriority;
  assignedToId?: string;
  notes?: string;
  rejectionReason?: string;
}

export interface ResolveComplaintDto {
  notes?: string;
  proofPhoto?: {
    fileUrl: string;
    fileKey: string;
    mimeType: string;
    fileSize: number;
  };
}

export interface SubmitFeedbackDto {
  rating: number;
  comments?: string;
}

export interface ReopenComplaintDto {
  reason: string;
}

export interface ComplaintQueryFilters {
  wardId?: string;
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  priority?: ComplaintPriority;
  isSlaBreached?: boolean;
  citizenId?: string;
  assignedToId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface DuplicateClusterMatch {
  isDuplicate: true;
  parentTicketNumber: string;
  parentId: string;
  message: string;
}

export interface NewComplaintCreated {
  isDuplicate: false;
  complaint: ComplaintDetailDto;
}

export type LodgeComplaintResult = DuplicateClusterMatch | NewComplaintCreated;

export const VALID_STATUS_TRANSITIONS: Record<ComplaintStatus, readonly ComplaintStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['ASSIGNED', 'REJECTED'],
  ASSIGNED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  REOPENED: ['ASSIGNED', 'UNDER_REVIEW'],
  REJECTED: [],
  CLOSED: [],
} as const;

export const ROLE_TRANSITION_PERMISSIONS: Partial<Record<ComplaintStatus, readonly Role[]>> = {
  UNDER_REVIEW: [Role.WARD_OFFICER, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN],
  ASSIGNED: [Role.WARD_OFFICER, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN],
  IN_PROGRESS: [Role.FIELD_WORKER, Role.DRIVER, Role.WARD_OFFICER, Role.MUNICIPAL_ADMIN],
  RESOLVED: [Role.FIELD_WORKER, Role.DRIVER, Role.WARD_OFFICER, Role.MUNICIPAL_ADMIN],
  REJECTED: [Role.WARD_OFFICER, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN],
  REOPENED: [Role.CITIZEN, Role.WARD_OFFICER, Role.MUNICIPAL_ADMIN],
  CLOSED: [Role.WARD_OFFICER, Role.MUNICIPAL_ADMIN, Role.SUPER_ADMIN],
};

