"use client";

import { Building2, Chrome, Github, Lock, Mail } from "lucide-react";
import Link from "next/link";

interface SignInFormProps {
  credentialsSignIn: (formData: FormData) => void;
  oauthActions: {
    github?: () => void;
    google?: () => void;
    "microsoft-entra-id"?: () => void;
  };
  error?: string | null;
}

export default function SignInForm({
  credentialsSignIn,
  oauthActions,
  error,
}: SignInFormProps) {
  return (
    <div className="w-full space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Please log in to continue.
        </h1>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* OAuth Providers */}
      <div className="space-y-3">
        {oauthActions.github && (
          <form action={oauthActions.github} className="w-full">
            <button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Github className="mr-2 h-4 w-4" />
              Continue with GitHub
            </button>
          </form>
        )}

        {oauthActions.google && (
          <form action={oauthActions.google} className="w-full">
            <button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Chrome className="mr-2 h-4 w-4" />
              Continue with Google
            </button>
          </form>
        )}

        {oauthActions["microsoft-entra-id"] && (
          <form action={oauthActions["microsoft-entra-id"]} className="w-full">
            <button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Continue with Microsoft
            </button>
          </form>
        )}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* Credentials Sign In Form */}
      <div className="flex-1 rounded-lg bg-gray-50 px-6 pb-4 pt-8">
        <form action={credentialsSignIn} className="space-y-3">
          <div>
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="email"
            >
              Email
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                required
              />
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>

          <div className="mt-4">
            <label
              className="mb-3 mt-5 block text-xs font-medium text-gray-900"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <input
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
                id="password"
                type="password"
                name="password"
                placeholder="Enter password"
                required
                minLength={6}
              />
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Mail className="mr-2 h-4 w-4" />
            Sign In with Email
          </button>
        </form>
      </div>

      {/* Sign Up Link */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
