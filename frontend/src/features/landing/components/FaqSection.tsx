import React from 'react';
import { Badge } from '@/shared/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';

const stats = [
  { value: '14+', label: 'Municipal Wards Digitized', sub: 'Kathmandu & Lalitpur' },
  { value: '45,000+', label: 'Metric Tons Collected', sub: 'Organic & Recyclable' },
  { value: '98.4%', label: 'On-Time Collection SLA', sub: 'PostGIS verified routes' },
  { value: '35%', label: 'Fleet Fuel Cost Reduction', sub: 'Smart routing algorithms' },
];

const faqs = [
  {
    question: 'How do I track garbage trucks in my ward?',
    answer:
      'Once registered with your household address and ward number, simply open the Live Tracking tab in the Citizen Portal. You will see active compactor trucks on the map with real-time speed, heading, and estimated time of arrival (ETA) at your neighborhood.',
  },
  {
    question: 'How do digital payments through eSewa and Khalti work?',
    answer:
      'At the start of each month, your municipal waste invoice is generated based on your property category and ward tariff. You can click "Pay Now" to seamlessly complete checkout via eSewa or Khalti with instant cryptographic signature verification and downloadable official tax receipts.',
  },
  {
    question: 'What happens if a collection is missed on my street?',
    answer:
      'You can instantly submit a grievance through the Complaints tab with a photo of uncollected bins. The system automatically tags your GPS location and dispatches an alert to your ward supervisor with a 48-hour resolution SLA.',
  },
  {
    question: 'Can any municipality or private waste contractor onboard?',
    answer:
      'Yes. WasteWise is a multi-tenant platform designed for metropolitan cities, sub-metropolitan cities, and rural municipalities across Nepal. Each municipality receives isolated database tenancy, custom ward boundaries, and dedicated fleet dispatching.',
  },
  {
    question: 'How do I request bulky or hazardous waste collection?',
    answer:
      'Navigate to "Bulky Waste Request" in your dashboard, select the waste category (such as furniture, electronics, or construction rubble), specify the estimated volume, and book an on-demand truck dispatch.',
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-16 sm:py-24 bg-slate-50/70 border-t border-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Civic Impact Metrics Grid */}
        <div id="impact" className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1 text-xs font-semibold">
              Measurable Civic Impact
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Transforming Urban Cleanliness Across Nepal
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 text-center shadow-2xs hover:shadow-md transition-shadow"
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm font-bold text-slate-900 leading-snug">
                  {stat.label}
                </div>
                <div className="mt-1 text-xs text-slate-500 font-medium">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1 text-xs font-semibold">
              Got Questions?
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600 font-normal">
              Everything you need to know about municipal operations, payments, and citizen services.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, idx) => (
                <AccordionItem
                  key={faq.question}
                  value={`item-${idx}`}
                  className="border-slate-100 last:border-b-0 py-1"
                >
                  <AccordionTrigger className="text-left text-[15px] font-semibold text-slate-900 hover:text-emerald-700 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-slate-600 leading-relaxed font-normal">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}

