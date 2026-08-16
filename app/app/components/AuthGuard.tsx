"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../api";

   // if you use baseUrl with "@" alias

import { Box, CircularProgress } from "@mui/material";

interface AuthGuardProps {
  allowedRoles?: string[]; // ["admin"], ["vendor"], etc.
  children: React.ReactNode;
}

/**
 * Universal role-based protection for any page.
 * Verifies token & role via /auth/me endpoint.
 */
export default function AuthGuard({ allowedRoles = [], children }: AuthGuardProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function verifyUser() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/dashboards/auth/login");
        return;
      }

      try {
        const res = await api.get("/auth/me"); // Uses your backend requireAuth
        const role = res.data?.user?.role;

        if (allowedRoles.length && !allowedRoles.includes(role)) {
          router.push("/unauthorized");
          return;
        }
      } catch (err) {
        console.error("Auth failed:", err);
        localStorage.removeItem("token");
        router.push("/dashboards/auth/login");
      } finally {
        setChecked(true);
      }
    }

    verifyUser();
  }, [allowedRoles, router]);

  if (!checked) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
