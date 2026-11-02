import React from 'react';
import Link from 'next/link';
import { LoginForm } from '../../../features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        <LoginForm />
        <div className="mt-4 text-center text-sm text-slate-600">
          New citizen?{' '}
          <Link href="/register" className="font-semibold text-emerald-600 hover:text-emerald-500">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}

