"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import { motion } from "framer-motion";
import { AlertCircle, Fingerprint, Loader2, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const router = useRouter();

  // Default Project ID found via script (Updated below)
  const _DEFAULT_PROJECT_ID = "b184a8cd-f212-4499-bb96-df4da2c68a51";

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => console.error("Geolocation denied:", err),
      );
    }
  }, []);

  // Passkey (WebAuthn) Login - Triggers TouchID/FaceID
  const handlePasskeyLogin = async () => {
    if (!email) {
      setError("Please enter your email first to use Passkey login.");
      return;
    }

    setPasskeyLoading(true);
    setError("");

    try {
      // Step 1: Get authentication options from server
      const optionsRes = await fetch("/api/v1/auth/passkey/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const optionsData = await optionsRes.json();

      if (!optionsRes.ok) {
        if (optionsData.error === "No passkeys registered") {
          throw new Error(
            "No passkey registered for this email. Sign in with email first, then add a passkey in settings.",
          );
        }
        throw new Error(optionsData.error || "Failed to get passkey options");
      }

      // Step 2: Trigger biometric prompt (TouchID/FaceID)
      const authResponse = await startAuthentication({
        optionsJSON: optionsData.options,
      });

      // Step 3: Verify with server
      const verifyRes = await fetch("/api/v1/auth/passkey/authenticate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: optionsData.userId,
          credential: authResponse,
          challenge: optionsData.challenge,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.error || "Passkey verification failed");
      }

      // SUCCESS!
      router.push("/dashboard?login=passkey");
    } catch (err: any) {
      console.error("Passkey error:", err);
      if (err.name === "NotAllowedError") {
        setError("Biometric authentication was cancelled or denied.");
      } else if (err.name === "SecurityError") {
        setError("Passkeys require a secure context (HTTPS or localhost).");
      } else {
        setError(err.message || "Passkey authentication failed.");
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Use the local proxy which forwards to localhost:3001
      const res = await fetch("/api/v1/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, type: "email" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to connect to backend");
      }

      // Verify Step
      setShowOtpInput(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Use the ADMIN auth endpoint (not endUser)
      const res = await fetch("/api/v1/admin/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: email,
          code: otp,
          name: isSignUp ? name : undefined,
          mobile: isSignUp ? mobile : undefined,
          locationLat: location?.lat,
          locationLng: location?.lng,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // SUCCESS - Admin is now logged in with session
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid Code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(37,99,235,0.15),rgba(0,0,0,0))]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-zinc-800/50 rounded-xl">
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {showOtpInput ? "Enter Code" : isSignUp ? "Create an Account" : "Welcome Back"}
          </h1>
          <p className="text-zinc-400 text-sm">
            {showOtpInput
              ? `We sent a code to ${email}`
              : isSignUp
                ? "Get started with your developer account."
                : "Enter your email to sign in."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-200 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!showOtpInput ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600"
                    placeholder="Alice Smith"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                {!location && (
                  <div className="flex items-center gap-2 text-amber-500 text-xs bg-amber-500/10 p-2 rounded">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Fetching location (Mandatory)...
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600"
                placeholder="you@company.com"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSignUp ? (
                "Sign Up with Email"
              ) : (
                "Continue with Email"
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-zinc-950 px-3 text-zinc-500">or continue with</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/api/v1/auth/oauth/google"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </a>
              <a
                href="/api/v1/auth/oauth/github"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"
                  />
                </svg>
                GitHub
              </a>
            </div>

            {/* Passkey Button */}
            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={passkeyLoading}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-lg hover:from-violet-600/30 hover:to-purple-600/30 transition-all text-sm font-medium disabled:opacity-50"
            >
              {passkeyLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Fingerprint className="w-5 h-5 text-violet-400" />
              )}
              {passkeyLoading ? "Authenticating..." : "Sign in with Passkey (TouchID/FaceID)"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-800"
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Code"}
            </button>

            <button
              type="button"
              onClick={() => setShowOtpInput(false)}
              className="w-full text-xs text-zinc-500 hover:text-zinc-300 mt-4 underline underline-offset-4"
            >
              Wrong email? Go back
            </button>
          </form>
        )}

        {!showOtpInput && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-500">
            Protected by <span className="text-zinc-300">IzzU Identity</span>. SOC2 Compliant.
          </p>
        </div>
      </motion.div>

      <div className="mt-8 text-zinc-500 text-sm">
        <Link href="/" className="hover:text-zinc-300 transition-colors">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
