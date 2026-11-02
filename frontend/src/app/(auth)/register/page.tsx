import React from 'react';
import Link from 'next/link';
import { RegisterForm } from '../../../features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        <RegisterForm />
        <div className="mt-4 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

