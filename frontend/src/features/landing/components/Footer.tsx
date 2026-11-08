import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Column 1: Brand & Municipal SaaS Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden bg-white shadow-xs">
                <Image src="/logo.webp" alt="WasteWise Logo" width={36} height={36} className="object-contain" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                WasteWise
              </span>
              <Badge variant="outline" className="text-[10px] border-emerald-500/50 bg-emerald-950/60 text-emerald-400">
                Municipal SaaS
              </Badge>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Empowering local governments across Nepal with smart GPS fleet routing, automated eSewa &amp; Khalti
              cashless tariffs, and transparent grievance resolution for cleaner neighborhoods.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>All Municipal Telemetry &amp; APIs Operational</span>
            </div>
          </div>

          {/* Column 2: Citizen Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Citizen Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/register" className="hover:text-emerald-400 transition-colors">
                  Register Household Property
                </Link>
              </li>
              <li>
                <Link href="/tracking" className="hover:text-emerald-400 transition-colors">
                  Live Truck GPS Tracking
                </Link>
              </li>
              <li>
                <Link href="/schedules" className="hover:text-emerald-400 transition-colors">
                  Ward Collection Schedules
                </Link>
              </li>
              <li>
                <Link href="/invoices" className="hover:text-emerald-400 transition-colors">
                  Pay Waste Tariffs (eSewa/Khalti)
                </Link>
              </li>
              <li>
                <Link href="/complaints" className="hover:text-emerald-400 transition-colors">
                  Report Missed Collection
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Municipal Administration */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Municipal Portal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">
                  Staff &amp; Officer Sign In
                </Link>
              </li>
              <li>
                <Link href="/fleet" className="hover:text-emerald-400 transition-colors">
                  Fleet &amp; Dispatch Control
                </Link>
              </li>
              <li>
                <Link href="/wards-admin" className="hover:text-emerald-400 transition-colors">
                  Ward Zone Management
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-emerald-400 transition-colors">
                  Executive KPI Analytics
                </Link>
              </li>
              <li>
                <Link href="/reports" className="hover:text-emerald-400 transition-colors">
                  Export Compliance Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Civic Support & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Sanitation Helpline
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Toll Free: 1660-01-92783</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>support@wastewise.gov.np</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Bagmati &amp; Gandaki Service Hubs</span>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Local Govt Operation Act 2074</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Attribution Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} WasteWise SaaS. Built for a Cleaner</span>
            <span className="text-emerald-400 font-semibold">Nepal</span>
            <Heart className="h-3 w-3 text-rose-500 fill-rose-500 inline ml-0.5" />
          </div>
          <div className="flex items-center gap-5">
            <Link href="#privacy" className="hover:text-slate-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#terms" className="hover:text-slate-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="#security" className="hover:text-slate-400 transition-colors">
              Data Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

