'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useWards, useZones, useCreateProperty, PropertyType } from '../hooks/useProperties';
import { propertyFormSchema, PropertyFormData } from '../types/property-form.schema';
import { RegistrationHeroCard } from './RegistrationHeroCard';
import { WardCategorySection } from './WardCategorySection';
import { PhysicalLocationSection } from './PhysicalLocationSection';
import { ContactPersonSection } from './ContactPersonSection';
import { GpsMapCard } from './GpsMapCard';

interface PropertyRegisterFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PropertyRegisterForm({ onSuccess, onCancel }: PropertyRegisterFormProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<boolean>(false);

  const { data: wards, isLoading: loadingWards } = useWards();
  const { data: zones, isLoading: loadingZones } = useZones(selectedWardId || null);
  const createPropertyMutation = useCreateProperty();

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      propertyType: 'RESIDENTIAL',
      latitude: 27.7172,
      longitude: 85.324,
      houseNumber: '',
      streetAddress: '',
      contactName: '',
      contactPhone: '',
    },
  });

  const lat = watch('latitude') ?? 27.7172;
  const lng = watch('longitude') ?? 85.324;
  const streetAddress = watch('streetAddress') || '';
  const propertyType = watch('propertyType') || 'RESIDENTIAL';
  const houseNumber = watch('houseNumber') || '';
  const zoneId = watch('zoneId') || null;
  const contactName = watch('contactName') || '';
  const contactPhone = watch('contactPhone') || '';

  const handleWardSelect = (wardId: string) => {
    startTransition(() => {
      setSelectedWardId(wardId);
      setValue('wardId', wardId, { shouldValidate: true });
      setValue('zoneId', null);
    });
  };

  const onSubmit = async (data: PropertyFormData) => {
    setFormError(null);
    setFormSuccess(false);

    try {
      await createPropertyMutation.mutateAsync({
        ...data,
        propertyType: data.propertyType as PropertyType,
        zoneId: data.zoneId || null,
        houseNumber: data.houseNumber || null,
      });

      setFormSuccess(true);
      reset();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register property';
      setFormError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
      {/* Global Alerts */}
      {formError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-[14px] text-rose-700 shadow-2xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {formSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-[14px] text-emerald-800 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>Premises registered successfully! Pending municipal verification.</span>
        </div>
      )}

      {/* Main Responsive Grid: 2-Column Split on Desktop, Stack on Tablet/Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Multi-Step Form Sections (7 cols on Desktop) */}
        <div className="lg:col-span-7 flex flex-col space-y-5">
          {/* Header Card with Stepper */}
          <RegistrationHeroCard />

          {/* 1. Municipal Ward & Category */}
          <WardCategorySection
            wards={wards}
            zones={zones}
            selectedWardId={selectedWardId}
            selectedZoneId={zoneId}
            propertyType={propertyType}
            houseNumber={houseNumber}
            loadingWards={loadingWards}
            loadingZones={loadingZones}
            wardError={errors.wardId?.message}
            onWardSelect={handleWardSelect}
            onZoneSelect={(z) => setValue('zoneId', z)}
            onPropertyTypeChange={(pt) => setValue('propertyType', pt)}
            onHouseNumberChange={(hn) => setValue('houseNumber', hn)}
          />

          {/* 2. Physical Location Details */}
          <PhysicalLocationSection
            streetAddress={streetAddress}
            streetAddressError={errors.streetAddress?.message}
            onStreetAddressChange={(addr) => setValue('streetAddress', addr, { shouldValidate: true })}
          />

          {/* 3. Authorized Contact Person */}
          <ContactPersonSection
            contactName={contactName}
            contactPhone={contactPhone}
            contactNameError={errors.contactName?.message}
            contactPhoneError={errors.contactPhone?.message}
            isSubmitting={createPropertyMutation.isPending || isPending}
            onContactNameChange={(name) => setValue('contactName', name, { shouldValidate: true })}
            onContactPhoneChange={(phone) => setValue('contactPhone', phone, { shouldValidate: true })}
            onCancel={onCancel}
          />
        </div>

        {/* Right Column: Sticky GPS Geofence Map (5 cols on Desktop) */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
          <GpsMapCard
            latitude={lat}
            longitude={lng}
            onCoordinatesChange={(newLat, newLng) => {
              setValue('latitude', newLat, { shouldValidate: true });
              setValue('longitude', newLng, { shouldValidate: true });
            }}
            onAddressDetected={(addr) => {
              setValue('streetAddress', addr, { shouldValidate: true });
            }}
            onDetectError={(msg) => setFormError(msg)}
          />
        </div>
      </div>
    </form>
  );
}
