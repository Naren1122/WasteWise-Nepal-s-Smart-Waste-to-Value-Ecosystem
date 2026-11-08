import React from 'react';
import { LandingView } from '@/features/landing/components/LandingView';

export const metadata = {
  title: 'WasteWise Nepal | Smart Municipal Solid Waste Management SaaS',
  description:
    'Modernizing municipal waste management across Nepal with live PostGIS GPS fleet tracking, automated eSewa & Khalti digital tariffs, and photo-verified citizen grievance redressal.',
};

export default function LandingPage() {
  return <LandingView />;
}
