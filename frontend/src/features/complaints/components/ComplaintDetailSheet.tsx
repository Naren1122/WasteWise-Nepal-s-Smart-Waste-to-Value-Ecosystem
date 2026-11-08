'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useComplaintDetail } from '../api/useComplaints';
import { STATUS_BADGE_CONFIG, CATEGORY_LABELS } from '../types/complaints.types';
import type { ComplaintPriority } from '../types/complaints.types';
import {
  MapPin,
  User,
  Phone,
  Clock,
  AlertTriangle,
  ExternalLink,
  FileText,
  Calendar,
  Building,
  HardHat,
  Maximize2,
  Copy,
  Check,
  Flame,
  X,
} from 'lucide-react';
import { ComplaintLifecycleStepper } from './ComplaintLifecycleStepper';
import { ComplaintTimelineView } from './ComplaintTimelineView';
import { ComplaintActionFooter } from './ComplaintActionFooter';

interface ComplaintDetailSheetProps {
  complaintId: string | null;
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  userId?: string;
}

export function ComplaintDetailSheet({
  complaintId,
  isOpen,
  onClose,
  userRole = 'CITIZEN',
  userId,
}: ComplaintDetailSheetProps) {
  const { data: complaint, isLoading } = useComplaintDetail(complaintId ?? undefined);
  const [copied, setCopied] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const handleCopyTicket = (ticketNo: string) => {
    navigator.clipboard.writeText(ticketNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPriorityBadge = (priority: ComplaintPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1">
            <Flame className="h-3 w-3 text-rose-600 fill-rose-500" /> Critical
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1">
            <Flame className="h-3 w-3 text-orange-600" /> High
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-600" /> Medium
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-50 text-slate-700 border-slate-200 flex items-center gap-1">
            Low
          </Badge>
        );
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] p-0 bg-white flex flex-col rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden gap-0">
          <DialogTitle className="sr-only">
            {complaint ? `Grievance #${complaint.ticketNumber}` : 'Grievance Details'}
          </DialogTitle>

          {isLoading || !complaint ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Sticky Header with Title & Badges */}
              <div className="bg-white border-b border-slate-200 p-5 pr-14 space-y-2.5 shrink-0 shadow-2xs">
                {/* Badges Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyTicket(complaint.ticketNumber)}
                    className="group font-mono text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Click to copy ticket number"
                  >
                    <span>#{complaint.ticketNumber}</span>
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-emerald-600 opacity-60 group-hover:opacity-100" />
                    )}
                  </button>

                  <Badge className={`${STATUS_BADGE_CONFIG[complaint.status]?.className} flex items-center gap-1.5`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {STATUS_BADGE_CONFIG[complaint.status]?.label}
                  </Badge>

                  {getPriorityBadge(complaint.priority)}
                </div>

                {/* Grievance Title */}
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug break-words tracking-tight">
                  {complaint.title}
                </h2>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {CATEGORY_LABELS[complaint.category]}
                  </span>
                  <span>•</span>
                  <span>Ward No. {complaint.wardNumber}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {new Date(complaint.createdAt).toLocaleDateString()} at{' '}
                    {new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
                {/* SLA Alert / Countdown */}
                {complaint.isSlaBreached ? (
                  <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm font-medium shadow-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>SLA Breached: Resolution target was {new Date(complaint.slaDeadline).toLocaleDateString()}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-xl text-xs text-emerald-900 shadow-xs">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="h-3.5 w-3.5 text-emerald-600" />
                      Target Resolution: {new Date(complaint.slaDeadline).toLocaleDateString()}
                    </span>
                    <span className="font-semibold text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      On Schedule
                    </span>
                  </div>
                )}

                {/* Resolution Pipeline Stepper */}
                <ComplaintLifecycleStepper status={complaint.status} />

                {/* Metadata Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Reporting Citizen */}
                  <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 space-y-1.5 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" /> Reporting Citizen
                    </span>
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                        {complaint.citizenName ? complaint.citizenName.slice(0, 2).toUpperCase() : 'CI'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 leading-tight">
                          {complaint.citizenName || 'Verified Citizen'}
                        </p>
                        {complaint.citizenPhone && (
                          <a
                            href={`tel:${complaint.citizenPhone}`}
                            className="text-xs text-slate-500 hover:text-emerald-700 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="h-3 w-3 text-emerald-600" />
                            {complaint.citizenPhone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ward & Field Crew Lead */}
                  <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 space-y-1.5 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-slate-400" /> Ward Assignment
                    </span>
                    <div className="pt-0.5">
                      <p className="text-sm font-semibold text-slate-800">Ward No. {complaint.wardNumber} Office</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                        <HardHat className="h-3 w-3 text-emerald-600" />
                        <span>
                          {complaint.assignedToName
                            ? `Assigned: ${complaint.assignedToName}`
                            : 'Awaiting Crew Dispatch'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location & GPS Link Card */}
                <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Location / Landmark
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                    >
                      <span>Google Maps</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 leading-snug">
                    {complaint.addressText || 'Kathmandu Municipality'}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      GPS: {complaint.latitude.toFixed(5)}, {complaint.longitude.toFixed(5)}
                    </span>
                  </div>
                </div>

                {/* Grievance Description */}
                <div className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-2 shadow-xs border-l-4 border-l-emerald-600">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-400" /> Grievance Description
                  </span>
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                    {complaint.description}
                  </p>
                </div>

                {/* Photo Evidence Gallery */}
                {complaint.attachments && complaint.attachments.length > 0 && (
                  <div className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-3 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Attached Photos & Evidence ({complaint.attachments.length})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {complaint.attachments.map((att) => (
                        <div
                          key={att.id}
                          onClick={() => setPreviewImageUrl(att.fileUrl)}
                          className="group relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shadow-xs cursor-pointer hover:border-emerald-500 transition-all aspect-video flex flex-col justify-end"
                        >
                          <img
                            src={att.fileUrl}
                            alt="Evidence"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white/95 rounded-full p-1.5 shadow-md">
                              <Maximize2 className="h-3.5 w-3.5 text-slate-800" />
                            </div>
                          </div>
                          <div className="relative z-10 p-1.5 text-[10px] font-bold text-white bg-slate-950/70 backdrop-blur-xs flex items-center justify-between">
                            <span className="truncate">
                              {att.attachmentType === 'RESOLUTION_PROOF' ? '✅ Resolution Proof' : '📷 Citizen Photo'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline / Audit Trail */}
                <ComplaintTimelineView timelines={complaint.timelines} />
              </div>

              {/* Sticky Action Footer */}
              <ComplaintActionFooter
                complaint={complaint}
                userRole={userRole}
                userId={userId}
                onClose={onClose}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Fullsize Image Lightbox Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs animate-in fade-in-0"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close preview</span>
            </button>
            <img
              src={previewImageUrl}
              alt="Evidence preview"
              className="max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
