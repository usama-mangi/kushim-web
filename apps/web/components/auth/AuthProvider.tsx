"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Loader2 } from "lucide-react";

const publicRoutes = ["/", "/login", "/register", "/forgot-password"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsChecking(false);
    };
    initAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isChecking && !isLoading) {
      if (!isAuthenticated && !publicRoutes.includes(pathname)) {
        router.push(`/login?redirect=${pathname}`);
      } else if (isAuthenticated && (pathname === "/login" || pathname === "/")) {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, isChecking, isLoading, pathname, router]);

  if (isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Prevent flashing of protected content
  if (!isAuthenticated && !publicRoutes.includes(pathname)) {
    return null; 
  }

  return <>{children}</>;
}
