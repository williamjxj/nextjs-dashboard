"use client";

import { useEffect, useState } from "react";

/**
 * HydrationBoundary component to handle hydration mismatches
 * caused by browser extensions or other client-side modifications
 */
export default function HydrationBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const [, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated after the component mounts
    setIsHydrated(true);
  }, []);

  // During SSR and before hydration, render children normally
  // After hydration, render children with full client-side features
  return <>{children}</>;
}

/**
 * NoSSR component to render content only on the client side
 * Use this for components that have hydration issues
 */
export function NoSSR({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <>{children}</>;
}

/**
 * ClientOnly wrapper for components that should only render on client
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
