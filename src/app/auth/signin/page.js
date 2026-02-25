"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function SignIn() {
  const { status } = useSession();
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const email = e.target.email.value;
    const password = e.target.password.value;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
    }
  }

  if (status === "loading") {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.card}>
          <p style={styles.loadingText}>Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.centerScreen}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Sign in to continue</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  centerScreen: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
  },
  card: {
    background: "#1e1e2f",
    padding: "40px 30px",
    borderRadius: "14px",
    boxShadow: "0 15px 40px rgba(0,0,0,0.6)",
    width: "100%",
    maxWidth: "400px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  title: {
    marginBottom: "5px",
    fontSize: "24px",
    fontWeight: "600",
    textAlign: "center",
    color: "#ffffff",
  },
  subtitle: {
    marginBottom: "25px",
    color: "#aaaaaa",
    textAlign: "center",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#cccccc",
  },
  input: {
    padding: "11px 14px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#2a2a3d",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
  },
  button: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
  },
  error: {
    marginTop: "15px",
    color: "#ff6b6b",
    fontSize: "14px",
    textAlign: "center",
  },
  loadingText: {
    textAlign: "center",
    fontSize: "14px",
    color: "#ccc",
  },
};
