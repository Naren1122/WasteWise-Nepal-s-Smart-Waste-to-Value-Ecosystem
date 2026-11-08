export type ComplaintCategory =
  | 'MISSED_PICKUP'
  | 'ILLEGAL_DUMPING'
  | 'OVERFLOWING_BIN'
  | 'STAFF_MISCONDUCT'
  | 'DAMAGED_INFRASTRUCTURE'
  | 'OTHER';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'
  | 'REOPENED'
  | 'CLOSED';

export type ComplaintAttachmentType = 'REPORT_PHOTO' | 'RESOLUTION_PROOF';

export interface ComplaintAttachmentDto {
  id: string;
  attachmentType: ComplaintAttachmentType;
  fileUrl: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  uploadedById: string;
  createdAt: string;
}

export interface ComplaintTimelineDto {
  id: string;
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  action: string;
  notes: string | null;
  performedById: string;
  performedByName?: string;
  createdAt: string;
}

export interface ComplaintFeedbackDto {
  id: string;
  rating: number;
  comments: string | null;
  createdAt: string;
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
  slaDeadline: string;
  isSlaBreached: boolean;
  rejectionReason: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
  slaDeadline: string;
  isSlaBreached: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

export interface LodgeComplaintPayload {
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

export interface TriageComplaintPayload {
  status: ComplaintStatus;
  priority?: ComplaintPriority;
  assignedToId?: string;
  notes?: string;
  rejectionReason?: string;
}

export interface ResolveComplaintPayload {
  notes?: string;
  proofPhoto?: {
    fileUrl: string;
    fileKey: string;
    mimeType: string;
    fileSize: number;
  };
}

export interface SubmitFeedbackPayload {
  rating: number;
  comments?: string;
}

export interface ReopenComplaintPayload {
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

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  MISSED_PICKUP: 'Missed Pickup',
  ILLEGAL_DUMPING: 'Illegal Dumping',
  OVERFLOWING_BIN: 'Overflowing Bin',
  STAFF_MISCONDUCT: 'Staff Misconduct',
  DAMAGED_INFRASTRUCTURE: 'Damaged Bin/Infrastructure',
  OTHER: 'Other Grievance',
};

export const STATUS_BADGE_CONFIG: Record<
  ComplaintStatus,
  { label: string; className: string }
> = {
  SUBMITTED: { label: 'Submitted', className: 'bg-slate-100 text-slate-700 border-slate-300' },
  UNDER_REVIEW: { label: 'Under Review', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  ASSIGNED: { label: 'Assigned', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  RESOLVED: { label: 'Resolved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Rejected', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  REOPENED: { label: 'Reopened', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  CLOSED: { label: 'Closed', className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

