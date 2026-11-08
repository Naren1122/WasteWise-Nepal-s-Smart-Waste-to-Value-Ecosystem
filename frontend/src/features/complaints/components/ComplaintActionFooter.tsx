'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Star, Shield, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import type { ComplaintDetailDto, ComplaintStatus } from '../types/complaints.types';
import {
  useTriageComplaint,
  useResolveComplaint,
  useSubmitFeedback,
} from '../api/useComplaints';

interface ComplaintActionFooterProps {
  complaint: ComplaintDetailDto;
  userRole?: string;
  userId?: string;
  onClose: () => void;
}

export function ComplaintActionFooter({
  complaint,
  userRole = 'CITIZEN',
  userId,
  onClose,
}: ComplaintActionFooterProps) {
  const triageMutation = useTriageComplaint();
  const resolveMutation = useResolveComplaint();
  const feedbackMutation = useSubmitFeedback();

  const [triageStatus, setTriageStatus] = useState<ComplaintStatus>(
    complaint.status === 'SUBMITTED' ? 'UNDER_REVIEW' : 'ASSIGNED'
  );
  const [triageNotes, setTriageNotes] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveProofUrl, setResolveProofUrl] = useState('');
  const [rating, setRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');

  const isStaff = ['WARD_OFFICER', 'MUNICIPAL_ADMIN', 'SUPER_ADMIN'].includes(userRole);
  const isFieldCrew = ['DRIVER', 'FIELD_WORKER'].includes(userRole) || isStaff;
  const isOwner = userId === complaint.citizenId;

  const handleTriage = async () => {
    await triageMutation.mutateAsync({
      id: complaint.id,
      payload: {
        status: triageStatus,
        notes: triageNotes || undefined,
        rejectionReason: triageStatus === 'REJECTED' ? (triageNotes || 'Grievance rejected by ward officer') : undefined,
      },
    });
    setTriageNotes('');
  };

  const handleResolve = async () => {
    await resolveMutation.mutateAsync({
      id: complaint.id,
      payload: {
        notes: resolveNotes,
        proofPhoto: resolveProofUrl
          ? { fileUrl: resolveProofUrl, fileKey: `proof_${Date.now()}`, mimeType: 'image/webp', fileSize: 100 * 1024 }
          : undefined,
      },
    });
  };

  const handleFeedback = async () => {
    await feedbackMutation.mutateAsync({
      id: complaint.id,
      payload: { rating, comments: feedbackComments || undefined },
    });
  };

  return (
    <div className="sticky bottom-0 bg-white border-t border-slate-200/90 p-4 shadow-lg space-y-3 z-20">
      {/* Staff Triage Control */}
      {isStaff && (complaint.status === 'SUBMITTED' || complaint.status === 'UNDER_REVIEW') && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-600" /> Ward Officer Triage
            </span>
            <span className="text-[11px] text-slate-400 font-normal">Update ticket status</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select value={triageStatus} onValueChange={(val) => setTriageStatus(val as ComplaintStatus)}>
              <SelectTrigger className="h-9 text-xs border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNDER_REVIEW">Mark Under Review</SelectItem>
                <SelectItem value="ASSIGNED">Dispatch to Field Crew</SelectItem>
                <SelectItem value="REJECTED">Reject Grievance</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleTriage}
              disabled={triageMutation.isPending}
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
            >
              {triageMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </div>

          <Input
            placeholder="Optional triage or assignment note..."
            value={triageNotes}
            onChange={(e) => setTriageNotes(e.target.value)}
            className="h-8 text-xs border-slate-200"
          />

          {triageMutation.isError && (
            <p className="text-xs text-rose-600 font-medium">
              {triageMutation.error instanceof Error ? triageMutation.error.message : 'Failed to update status'}
            </p>
          )}
        </div>
      )}

      {/* Field Crew Resolution Control */}
      {isFieldCrew && (complaint.status === 'ASSIGNED' || complaint.status === 'IN_PROGRESS') && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Crew Resolution Action
            </span>
          </div>

          <Input
            placeholder="Proof photo URL (optional)..."
            value={resolveProofUrl}
            onChange={(e) => setResolveProofUrl(e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            placeholder="Resolution remarks (e.g. Cleared 200kg waste)..."
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
            className="h-8 text-xs"
          />

          <Button
            onClick={handleResolve}
            disabled={resolveMutation.isPending}
            className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
          >
            {resolveMutation.isPending ? 'Submitting...' : 'Mark as Resolved'}
          </Button>
        </div>
      )}

      {/* Citizen Feedback Form for Resolved Tickets */}
      {isOwner && complaint.status === 'RESOLVED' && !complaint.feedback && (
        <div className="space-y-2.5 bg-amber-50/70 border border-amber-200/90 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Rate Resolution Quality
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setRating(st)}
                  className={`p-0.5 transition-colors ${st <= rating ? 'text-amber-500' : 'text-slate-300'}`}
                >
                  <Star className="h-4 w-4 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="How was the municipal service?"
              value={feedbackComments}
              onChange={(e) => setFeedbackComments(e.target.value)}
              className="h-8 text-xs bg-white border-amber-200"
            />
            <Button
              onClick={handleFeedback}
              disabled={feedbackMutation.isPending}
              className="h-8 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs shrink-0"
            >
              Submit
            </Button>
          </div>
        </div>
      )}

      {/* Citizen Info Banner for Pending Tickets */}
      {!isStaff && !isFieldCrew && complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED' && (
        <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-emerald-600" />
            Ward team is processing your request
          </span>
          <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs">
            Close
          </Button>
        </div>
      )}
    </div>
  );
}

