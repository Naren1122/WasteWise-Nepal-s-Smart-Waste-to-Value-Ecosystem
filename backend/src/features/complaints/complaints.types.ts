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
  performedByName?: string | undefined;
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
  wardNumber?: number | undefined;
  citizenId: string;
  citizenName?: string | undefined;
  citizenPhone?: string | undefined;
  assignedToId: string | null;
  assignedToName?: string | null | undefined;
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
  subscriberCount?: number | undefined;
}

export interface ComplaintSummaryDto {
  id: string;
  ticketNumber: string;
  wardId: string;
  wardNumber?: number | undefined;
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
  priority?: ComplaintPriority | undefined;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  addressText?: string | undefined;
  attachments?: Array<{
    fileUrl: string;
    fileKey: string;
    mimeType: string;
    fileSize: number;
  }> | undefined;
}

export interface TriageComplaintDto {
  status: ComplaintStatus;
  priority?: ComplaintPriority | undefined;
  assignedToId?: string | undefined;
  notes?: string | undefined;
  rejectionReason?: string | undefined;
}

export interface ResolveComplaintDto {
  notes?: string | undefined;
  proofPhoto?: {
    fileUrl: string;
    fileKey: string;
    mimeType: string;
    fileSize: number;
  } | undefined;
}

export interface SubmitFeedbackDto {
  rating: number;
  comments?: string | undefined;
}

export interface ReopenComplaintDto {
  reason: string;
}

export interface ComplaintQueryFilters {
  wardId?: string | undefined;
  status?: ComplaintStatus | undefined;
  category?: ComplaintCategory | undefined;
  priority?: ComplaintPriority | undefined;
  isSlaBreached?: boolean | undefined;
  citizenId?: string | undefined;
  assignedToId?: string | undefined;
  search?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
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
  SUBMITTED: ['UNDER_REVIEW', 'ASSIGNED', 'REJECTED'],
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
