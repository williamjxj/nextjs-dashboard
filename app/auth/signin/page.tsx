import {
  credentialsSignIn,
  githubSignIn,
  googleSignIn,
  microsoftSignIn,
} from "@/app/lib/auth-actions";
import AcmeLogo from "@/app/ui/acme-logo";
import SignInForm from "@/app/ui/signin-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // If already signed in, redirect to dashboard
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error
    ? decodeURIComponent(resolvedSearchParams.error)
    : null;

  return (
    <main className="flex items-center justify-center md:h-screen bg-gray-50">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3 md:h-36">
          <div className="w-32 text-white md:w-36">
            <AcmeLogo />
          </div>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <SignInForm
            credentialsSignIn={credentialsSignIn}
            oauthActions={{
              github: githubSignIn,
              google: googleSignIn,
              "microsoft-entra-id": microsoftSignIn,
            }}
            error={error}
          />
        </Suspense>
      </div>
    </main>
  );
}
