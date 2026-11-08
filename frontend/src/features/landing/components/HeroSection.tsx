import React from 'react';
import Link from 'next/link';
import {
  Truck,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Receipt,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-white py-14 sm:py-20 lg:py-24">
      {/* Background Decorative Blur Blobs */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-emerald-200 to-teal-100 opacity-40 sm:left-[calc(50%-30rem)] sm:w-[72rem]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            {/* National Announcement Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
              <span>Nepal&apos;s Digital Municipal SaaS</span>
              <span className="text-emerald-300">|</span>
              <span className="text-emerald-700 font-normal">Kathmandu &amp; Beyond</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Clean Wards, Transparent Billing &amp;{' '}
              <span className="text-emerald-600 decoration-emerald-200 underline decoration-wavy decoration-2 underline-offset-6">
                Live Fleet GPS
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              WasteWise modernizes municipal sanitation for Nepali local governments. Track garbage
              trucks in real-time, pay monthly tariffs via eSewa &amp; Khalti, and resolve neighborhood
              grievances with photo verification.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Button asChild className="w-full sm:w-auto h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm active:scale-[0.98]">
                <Link href="/register" className="flex items-center justify-center gap-2">
                  <span>Register Household Property</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full sm:w-auto h-12 px-6 rounded-xl border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-medium">
                <Link href="/login" className="flex items-center justify-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Municipal Staff Login</span>
                </Link>
              </Button>
            </div>

            {/* Quick Civic Badges */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>eSewa &amp; Khalti Integrated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>PostGIS Geospatial Accuracy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Multi-Ward SLA Redressal</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Operational Telemetry Preview Card */}
          <div className="lg:col-span-5">
            <Card padding="none" className="rounded-2xl border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-200/50">
              <div className="p-4 sm:p-5 space-y-4">
                {/* Live Header Simulation */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Live Municipal Telemetry
                    </span>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold">
                    Ward 04 • Active
                  </Badge>
                </div>

                {/* Truck Live Location Card */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Compactor Truck #07</div>
                        <div className="text-[11px] text-slate-500">Plate: BA-2-KHA-4040</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-white border-slate-200 text-slate-700">
                      Speed: 18 km/h
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <MapPin className="h-3 w-3" /> Lazimpat Main Route
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="h-3 w-3" /> ETA: 6 mins
                    </span>
                  </div>
                </div>

                {/* Telemetry Micro-Stats Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs">
                    <div className="text-[11px] font-medium text-slate-500">Pickups Done</div>
                    <div className="text-lg font-extrabold text-slate-900 mt-0.5">98.4%</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">384 of 390 bins</div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs">
                    <div className="text-[11px] font-medium text-slate-500">Tariff Collection</div>
                    <div className="text-lg font-extrabold text-slate-900 mt-0.5">NPR 1.84M</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">91% Digital eSewa</div>
                  </div>
                </div>

                {/* Quick Citizen Status Notice */}
                <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 p-3 flex items-start gap-2.5">
                  <Receipt className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900">
                    <span className="font-semibold">Next Scheduled Collection:</span> Tomorrow morning at 06:30 AM (Organic Waste).
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
