"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  function getErrorMessage(error) {
    switch (error) {
      case "CredentialsSignin":
        return "Invalid email or password.";
      case "AccessDenied":
        return "You do not have permission to access this.";
      case "Configuration":
        return "Server configuration error.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  return (
    <div style={{ textAlign: "center", marginTop: 80 }}>
      <h2>Authentication Error</h2>

      <p style={{ color: "red", marginTop: 10 }}>{getErrorMessage(error)}</p>

      <Link
        href="/auth/signin"
        style={{
          display: "inline-block",
          marginTop: 20,
          padding: "8px 16px",
          backgroundColor: "#0070f3",
          color: "white",
          borderRadius: 5,
          textDecoration: "none",
        }}
      >
        Back to Sign In
      </Link>
    </div>
  );
}
