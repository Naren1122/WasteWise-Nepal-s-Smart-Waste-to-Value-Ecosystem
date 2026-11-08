'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { useAuthStore } from '@/shared/stores/auth.store';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Municipal Impact', href: '#impact' },
  { label: 'FAQs', href: '#faq' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & SaaS Tagline */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-extrabold text-lg shadow-sm transition-transform group-hover:scale-105">
            W
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[17px] tracking-tight text-slate-900 leading-tight">
                WasteWise
              </span>
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-bold border-emerald-200 bg-emerald-50 text-emerald-700">
                NEPAL
              </Badge>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              Smart Municipal SaaS
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[14px] font-medium text-slate-600 hover:text-emerald-700 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Button asChild className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span>Dashboard ({user?.fullName?.split(' ')[0] || 'User'})</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" className="h-10 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs">
                <Link href="/register" className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span>Citizen Portal</span>
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Drawer Trigger */}
        <div className="flex md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-11 w-11 border-slate-200">
                <Menu className="h-5 w-5 text-slate-700" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-xs p-6 bg-white flex flex-col justify-between">
              <div className="space-y-6">
                <SheetHeader className="text-left pb-4 border-b border-slate-100">
                  <SheetTitle className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">
                      W
                    </span>
                    WasteWise
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-3">
                  {navLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="px-3 py-2.5 rounded-lg text-[15px] font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-2.5">
                {isAuthenticated ? (
                  <Button asChild className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                    <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                      Go to Dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full h-12 border-slate-300 font-medium">
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                    <Button asChild className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                      <Link href="/register" onClick={() => setIsOpen(false)}>
                        Citizen Portal
                      </Link>
                    </Button>
                  </>
                )}
                <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Verified Municipal SaaS</span>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
