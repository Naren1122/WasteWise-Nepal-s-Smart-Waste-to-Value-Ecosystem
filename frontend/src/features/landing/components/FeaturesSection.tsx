import React from 'react';
import {
  MapPin,
  Receipt,
  Camera,
  CalendarDays,
  BarChart3,
  PackagePlus,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

interface FeatureItem {
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  title: string;
  description: string;
  highlight: string;
}

const features: FeatureItem[] = [
  {
    icon: MapPin,
    badge: 'Real-Time Telemetry',
    title: 'Live PostGIS GPS Fleet Tracking',
    description:
      'Real-time vehicle tracking with 5-second telemetry breadcrumbs, ward boundary geo-fencing, and proximity arrival alerts for residents.',
    highlight: 'Socket.IO + PostGIS Engine',
  },
  {
    icon: Receipt,
    badge: 'Cashless Economy',
    title: 'Automated eSewa & Khalti Billing',
    description:
      'Ward-based monthly tariff calculation, digital invoices with HMAC-SHA256 signature verification, and instant receipt generation.',
    highlight: '100% Cashless Reconciliation',
  },
  {
    icon: Camera,
    badge: 'Civic Redressal',
    title: 'Photo-Verified Grievance Triage',
    description:
      'Citizens submit complaints with geo-tagged photos. Ward supervisors assign workers, and resolution requires photo proof before closing.',
    highlight: 'Strict 48-Hour SLA Escalation',
  },
  {
    icon: PackagePlus,
    badge: 'On-Demand Service',
    title: 'Bulky & Hazardous Waste Pickups',
    description:
      'Citizens request special collections for e-waste, construction debris, or tree branches with custom volume-based pricing and designated trucks.',
    highlight: 'Specialized Dispatch Workflow',
  },
  {
    icon: BarChart3,
    badge: 'Municipal Intelligence',
    title: 'Ward Analytics & KPI Leaderboards',
    description:
      'Executive dashboard tracking daily tonnage, route coverage efficiency, citizen satisfaction rates, and ward officer performance.',
    highlight: 'Immutable Audit Trail',
  },
  {
    icon: CalendarDays,
    badge: 'Citizen Transparency',
    title: 'Dynamic Waste Segregation Schedules',
    description:
      'Clear, ward-specific pickup timetables for organic vs recyclable waste, national holiday adjustments, and automated SMS / push reminders.',
    highlight: 'Zero Missed Pickups',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-24 bg-slate-50/60 border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1 text-xs font-semibold">
            Platform Capabilities
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Modern, Clean &amp; Accountable Municipalities
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            Eliminating missed collections, manual billing disputes, and unmonitored fleets with a unified,
            cloud-native SaaS platform built specifically for local governments.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                padding="none"
                className="group relative rounded-2xl border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Icon & Badge Header */}
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200 shadow-2xs">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[11px] font-medium border-slate-200 bg-slate-50/80 text-slate-600">
                      {feature.badge}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Footer Highlight */}
                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                  <span>{feature.highlight}</span>
                  <ArrowUpRight className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

