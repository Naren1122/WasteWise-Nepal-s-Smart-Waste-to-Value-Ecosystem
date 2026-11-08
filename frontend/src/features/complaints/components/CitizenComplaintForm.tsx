'use client';

import React, { useActionState, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { useLodgeComplaint } from '../api/useComplaints';
import { CATEGORY_LABELS } from '../types/complaints.types';
import type { ComplaintCategory, LodgeComplaintResult } from '../types/complaints.types';
import { reverseGeocode } from '@/shared/utils/geocoding';
import { MapPin, AlertCircle, CheckCircle2, Loader2, Navigation, X, Camera } from 'lucide-react';

const DynamicMapPinPicker = dynamic(
  () => import('./ComplaintMapPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[220px] rounded-lg bg-slate-100 flex flex-col items-center justify-center gap-2 border border-slate-200">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Loading Map...</span>
      </div>
    ),
  }
);

interface FormState {
  status: 'idle' | 'success' | 'error';
  result?: LodgeComplaintResult;
  errorMessage?: string;
}

interface CitizenComplaintFormProps {
  wards: Array<{ id: string; wardNumber: number }>;
  onSuccess?: (result: LodgeComplaintResult) => void;
}

export function CitizenComplaintForm({ wards, onSuccess }: CitizenComplaintFormProps) {
  const lodgeMutation = useLodgeComplaint();
  const [category, setCategory] = useState<ComplaintCategory>('MISSED_PICKUP');
  const [wardId, setWardId] = useState<string>(wards[0]?.id ?? '');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 27.7172, lng: 85.324 });
  const [addressText, setAddressText] = useState<string>('');
  const [isLocating, setIsLocating] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoMeta, setPhotoMeta] = useState<{ name: string; size: number; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setCoords({ lat, lng });

        // Auto-fill address via OpenStreetMap Nominatim reverse geocoding
        const detectedAddress = await reverseGeocode(lat, lng);
        if (detectedAddress) {
          setAddressText(detectedAddress);
        }
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePinMoved = async (lat: number, lng: number) => {
    setCoords({ lat, lng });
    const detectedAddress = await reverseGeocode(lat, lng);
    if (detectedAddress) {
      setAddressText(detectedAddress);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Please select a valid image (JPEG, PNG, or WebP)');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setPhotoError('Original image must be smaller than 15MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const MAX_DIM = 1280;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          const approxBytes = Math.round((compressed.length * 3) / 4);
          setPhotoDataUrl(compressed);
          setPhotoMeta({
            name: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
            size: approxBytes,
            mimeType: 'image/jpeg',
          });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoDataUrl(null);
    setPhotoMeta(null);
    setPhotoError(null);
  };

  const submitAction = async (_: FormState, formData: FormData): Promise<FormState> => {
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';

    if (title.trim().length < 5) return { status: 'error', errorMessage: 'Title must be at least 5 characters' };
    if (description.trim().length < 10) return { status: 'error', errorMessage: 'Description must be at least 10 characters' };
    if (!wardId) return { status: 'error', errorMessage: 'Please select your municipal ward' };

    try {
      const res = await lodgeMutation.mutateAsync({
        wardId,
        category,
        title: title.trim(),
        description: description.trim(),
        latitude: coords.lat,
        longitude: coords.lng,
        addressText: addressText.trim() || undefined,
        attachments: photoDataUrl && photoMeta
          ? [{ fileUrl: photoDataUrl, fileKey: photoMeta.name, mimeType: photoMeta.mimeType, fileSize: photoMeta.size }]
          : undefined,
      });

      onSuccess?.(res);
      handleRemovePhoto();
      return { status: 'success', result: res };
    } catch (err) {
      return { status: 'error', errorMessage: err instanceof Error ? err.message : 'Failed to lodge complaint' };
    }
  };

  const [state, formAction, isPending] = useActionState(submitAction, { status: 'idle' });

  // Safe extraction of ticket details to prevent runtime TypeError
  const result = state.result;
  const isDuplicate = result?.isDuplicate ?? false;
  const parentTicketNumber = result && 'parentTicketNumber' in result ? result.parentTicketNumber : '';
  const newTicketNumber =
    result && !isDuplicate
      ? 'complaint' in result && result.complaint
        ? result.complaint.ticketNumber
        : (result as unknown as { ticketNumber?: string }).ticketNumber ?? 'CONFIRMED'
      : '';
  const slaTarget =
    result && !isDuplicate
      ? 'complaint' in result && result.complaint
        ? result.complaint.slaDeadline
        : (result as unknown as { slaDeadline?: string }).slaDeadline ?? new Date().toISOString()
      : new Date().toISOString();

  return (
    <Card className="w-full bg-white border border-slate-200/80 rounded-xl shadow-sm p-6">
      <div className="mb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Report an Issue / Grievance</h2>
        <p className="text-[15px] text-slate-500 mt-1">Lodge missed pickups or dumping. Pin the exact location on the map.</p>
      </div>

      <form action={formAction} className="space-y-4">
        {state.status === 'success' && state.result && (
          <Alert className={isDuplicate ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}>
            <CheckCircle2 className="h-5 w-5" />
            <AlertTitle className="font-semibold text-[15px]">{isDuplicate ? 'Clustered Duplicate Incident' : 'Complaint Successfully Lodged'}</AlertTitle>
            <AlertDescription className="text-sm mt-1">
              {isDuplicate ? (
                <span>Report for this location is active under Ticket <strong>#{parentTicketNumber}</strong>. You are subscribed.</span>
              ) : (
                <span>Ticket <strong>#{newTicketNumber}</strong> has been logged. SLA Target: {new Date(slaTarget).toLocaleDateString()}.</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {state.status === 'error' && state.errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-[15px] font-semibold">Submission Failed</AlertTitle>
            <AlertDescription className="text-sm">{state.errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[15px] font-medium text-slate-700">Issue Category</label>
            <Select value={category} onValueChange={(val) => setCategory(val as ComplaintCategory)}>
              <SelectTrigger className="h-10 sm:h-11 border-slate-300"><SelectValue placeholder="Select Category" /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as ComplaintCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[15px] font-medium text-slate-700">Ward Office</label>
            <Select value={wardId} onValueChange={setWardId}>
              <SelectTrigger className="h-10 sm:h-11 border-slate-300"><SelectValue placeholder="Select Ward" /></SelectTrigger>
              <SelectContent>
                {wards.map((w) => (<SelectItem key={w.id} value={w.id}>Ward No. {w.wardNumber}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[15px] font-medium text-slate-700">Title</label>
          <Input name="title" placeholder="e.g. Uncollected garbage pile near crossroads" className="h-10 sm:h-11 border-slate-300 text-[15px]" required />
        </div>

        <div className="space-y-1.5">
          <label className="text-[15px] font-medium text-slate-700">Description</label>
          <Textarea name="description" placeholder="Provide specific landmarks, waste type, or vehicle info..." className="min-h-[80px] border-slate-300 text-[15px]" required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[15px] font-medium text-slate-700">Landmark / Address (Auto-filled by GPS)</label>
            <Input
              name="addressText"
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder="e.g. Lazimpat, Kathmandu (auto-filled on GPS detect)"
              className="h-10 sm:h-11 border-slate-300 text-[15px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[15px] font-medium text-slate-700">Proof Photo (Optional)</label>
            {photoDataUrl ? (
              <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-50 flex items-center gap-3">
                <img src={photoDataUrl} alt="Proof preview" className="w-12 h-12 rounded object-cover border border-slate-200 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-700 truncate">{photoMeta?.name}</p>
                  <p className="text-[11px] text-slate-400">{Math.round((photoMeta?.size ?? 0) / 1024)} KB</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={handleRemovePhoto} className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <label htmlFor="photo-file" className="cursor-pointer flex items-center justify-center gap-2 h-10 sm:h-11 border border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium transition-colors">
                  <Camera className="h-4 w-4 text-emerald-600" />
                  <span>Choose Photo / Camera</span>
                </label>
                <input id="photo-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelect} className="hidden" />
                {photoError && <p className="text-xs text-rose-600 mt-1">{photoError}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Interactive Leaflet Map Pin Picker */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-[14px] font-medium text-slate-700 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>Pin Incident Location (Drag or Click Map)</span>
            </label>
            <Button type="button" variant="outline" size="sm" onClick={handleGetCurrentLocation} disabled={isLocating} className="h-7 text-xs font-medium">
              {isLocating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Navigation className="h-3 w-3 mr-1" />}
              Detect My GPS
            </Button>
          </div>
          <DynamicMapPinPicker
            latitude={coords.lat}
            longitude={coords.lng}
            onCoordinatesChange={handlePinMoved}
          />
          <p className="text-[11px] text-slate-400">Pinned GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto h-10 sm:h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit Grievance
          </Button>
        </div>
      </form>
    </Card>
  );
}
