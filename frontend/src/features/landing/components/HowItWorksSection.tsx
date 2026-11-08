import React from 'react';
import Link from 'next/link';
import {
  Home,
  Truck,
  CreditCard,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';

interface StepItem {
  step: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  bullets: string[];
}

const steps: StepItem[] = [
  {
    step: '01',
    icon: Home,
    title: 'Register Household & Ward',
    description:
      'Citizens enroll in less than 2 minutes. Enter your property details and ward number to automatically link to your local collection schedule.',
    bullets: [
      'Digital property QR & ward mapping',
      'Assigned waste segregation schedule',
      'Instant resident portal access',
    ],
  },
  {
    step: '02',
    icon: Truck,
    title: 'Track Live Fleet & Get Alerts',
    description:
      'Never miss the waste truck again. Watch collection compactors move along your ward street in real-time with automated arrival alerts.',
    bullets: [
      'Live PostGIS map tracking',
      '15-minute proximity alerts',
      'Organic vs recyclable schedule reminders',
    ],
  },
  {
    step: '03',
    icon: CreditCard,
    title: 'Pay Digitally & Report Grievances',
    description:
      'Pay monthly municipal waste tariffs with eSewa or Khalti in one tap. Have an issue? Submit a photo complaint for 48-hour resolution.',
    bullets: [
      'Instant HMAC-verified payment receipts',
      'Zero paper invoice hassles',
      'Photo-verified grievance closure',
    ],
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-16">
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1 text-xs font-semibold">
            Simple 3-Step Process
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How WasteWise Works for Every Citizen
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            A frictionless digital bridge connecting municipal sanitation departments directly with
            households, commercial establishments, and ward committees.
          </p>
        </div>

        {/* 3-Step Card Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.step}
                padding="none"
                className="relative rounded-2xl border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Step Header Counter & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white font-extrabold text-sm shadow-xs">
                      {item.step}
                    </span>
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">
                    {item.description}
                  </p>

                  {/* Bullet Highlights */}
                  <ul className="space-y-2.5">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Bottom Banner Call to Action */}
        <div className="mt-12 sm:mt-16 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 p-8 sm:p-10 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold">
              Ready to modernize waste management in your ward?
            </h3>
            <p className="text-emerald-100 text-sm max-w-xl">
              Join thousands of households across Nepal already enjoying transparent, on-time collections and digital billing.
            </p>
          </div>
          <Button asChild className="h-12 px-6 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold shadow-sm shrink-0 w-full sm:w-auto">
            <Link href="/register" className="flex items-center justify-center gap-2">
              <span>Enroll Your Household Now</span>
              <ArrowRight className="h-4 w-4 text-emerald-800" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

