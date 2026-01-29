"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIzzU } from "./IzzUProvider";

interface IzzUAuthProps {
  mode: "signin" | "signup";
  requireCamera?: boolean;
  requireLocation?: boolean;
  requirePassword?: boolean;
  allowFaceOnlyLogin?: boolean;
  onSuccess?: (user: any) => void;
  onFailure?: (error: string) => void;
  onFaceCapture?: (photoUrl: string) => void;
  onLocationCapture?: (coords: { lat: number; lng: number }) => void;
}

type AuthStep = "face-scan" | "email" | "password" | "otp" | "face-register" | "success" | "error";

export function IzzUAuth({
  mode = "signin",
  requireCamera = true,
  requireLocation = true,
  requirePassword = true,
  allowFaceOnlyLogin = true,
  onSuccess,
  onFailure,
  onFaceCapture,
  onLocationCapture,
}: IzzUAuthProps) {
  const { projectId, apiKey, apiBaseUrl } = useIzzU();

  // Auth state
  const [step, setStep] = useState<AuthStep>(
    mode === "signin" && allowFaceOnlyLogin ? "face-scan" : "email",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Location state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Request location permission on mount
  useEffect(() => {
    if (requireLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setLocation(coords);
          onLocationCapture?.(coords);
        },
        (err) => {
          setLocationError("Location access required. Please enable GPS.");
          console.error("Location error:", err);
        },
        { enableHighAccuracy: true },
      );
    }
  }, [requireLocation, onLocationCapture]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setCameraError("");
      }
    } catch (_err) {
      setCameraError("Camera access denied. Face ID is mandatory.");
      onFailure?.("Camera permission denied");
    }
  }, [onFailure]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => { track.stop(); });
      streamRef.current = null;
      setCameraActive(false);
    }
  }, []);

  // Capture face and verify/register
  const captureAndProcess = async (action: "verify" | "register") => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsLoading(true);
    setError("");

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
    }

    canvasRef.current.toBlob(
      async (blob) => {
        if (!blob) {
          setError("Failed to capture image");
          setIsLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", blob, "face.jpg");
        formData.append("email", email);
        formData.append("project_id", projectId);
        if (location) {
          formData.append("location_lat", String(location.lat));
          formData.append("location_lng", String(location.lng));
        }

        try {
          const endpoint =
            action === "register"
              ? `${apiBaseUrl}/v1/sdk/face/register`
              : `${apiBaseUrl}/v1/sdk/face/identify`;

          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "X-API-Key": apiKey },
            body: formData,
            credentials: "include",
          });

          const data = await res.json();

          if (res.ok && (data.verified || data.registered)) {
            stopCamera();
            if (data.photoUrl) onFaceCapture?.(data.photoUrl);
            setStep("success");
            onSuccess?.(data.user);
          } else if (action === "verify" && !data.verified) {
            // Face not recognized - fall back to email/password
            stopCamera();
            setError("Face not recognized. Please use email & password.");
            setStep("email");
          } else {
            setError(data.error || "Verification failed");
          }
        } catch (_err: any) {
          setError("Network error. Please try again.");
        } finally {
          setIsLoading(false);
        }
      },
      "image/jpeg",
      0.9,
    );
  };

  // Handle email submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (mode === "signup" && requirePassword) {
      setStep("password");
    } else {
      // For signin without face, send OTP
      await sendOtp();
    }
  };

  // Handle password submission (signup)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    await sendOtp();
  };

  // Send OTP
  const sendOtp = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${apiBaseUrl}/v1/sdk/otp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({ email, project_id: projectId }),
      });

      if (res.ok) {
        setStep("otp");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send OTP");
      }
    } catch (_err) {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${apiBaseUrl}/v1/sdk/otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          email,
          code: otp,
          password: mode === "signup" ? password : undefined,
          project_id: projectId,
          location_lat: location?.lat,
          location_lng: location?.lng,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        if (mode === "signup" && requireCamera) {
          // Signup: Now capture Face ID
          setStep("face-register");
          startCamera();
        } else {
          // Signin: Success
          setStep("success");
          onSuccess?.(data.user);
        }
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch (_err) {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-start camera for face-scan step
  useEffect(() => {
    if (step === "face-scan" && requireCamera) {
      startCamera();
    }
    return () => {
      if (step !== "face-scan" && step !== "face-register") {
        stopCamera();
      }
    };
  }, [step, requireCamera, startCamera, stopCamera]);

  // Styles
  const containerStyle: React.CSSProperties = {
    maxWidth: "420px",
    margin: "0 auto",
    padding: "32px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    backgroundColor: "#0a0a0a",
    borderRadius: "16px",
    border: "1px solid #27272a",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    fontSize: "16px",
    backgroundColor: "#18181b",
    border: "1px solid #3f3f46",
    borderRadius: "10px",
    color: "#fff",
    outline: "none",
    marginBottom: "12px",
  };

  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px",
    fontSize: "16px",
    fontWeight: 600,
    color: "white",
    backgroundColor: "#2563eb",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "14px",
    color: "#a1a1aa",
    marginBottom: "6px",
  };

  // RENDER: Success
  if (step === "success") {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
          <h2 style={{ margin: 0, color: "#fff" }}>
            {mode === "signup" ? "Account Created!" : "Welcome Back!"}
          </h2>
          <p style={{ color: "#71717a", marginTop: "8px" }}>
            {mode === "signup"
              ? "Your Face ID has been registered."
              : "Face ID verified successfully."}
          </p>
        </div>
      </div>
    );
  }

  // RENDER: Face Scan (Sign In - Face Only)
  if (step === "face-scan") {
    return (
      <div style={containerStyle}>
        <h2 style={{ textAlign: "center", color: "#fff", marginBottom: "8px" }}>
          🔐 Face ID Login
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "#71717a",
            marginBottom: "20px",
          }}
        >
          Look at the camera to sign in instantly
        </p>

        {cameraError ? (
          <div
            style={{
              color: "#ef4444",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            {cameraError}
          </div>
        ) : (
          <>
            <div
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "16px",
                position: "relative",
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", display: "block" }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              {!cameraActive && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#18181b",
                  }}
                >
                  <span style={{ color: "#71717a" }}>Starting camera...</span>
                </div>
              )}
            </div>

            {error && (
              <p
                style={{
                  color: "#ef4444",
                  textAlign: "center",
                  marginBottom: "12px",
                }}
              >
                {error}
              </p>
            )}

            <button
              onClick={() => captureAndProcess("verify")}
              disabled={isLoading || !cameraActive}
              style={{
                ...buttonStyle,
                backgroundColor: "#10b981",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? "Verifying..." : "🔓 Unlock with Face"}
            </button>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={() => {
              stopCamera();
              setStep("email");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#3b82f6",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Use email & password instead
          </button>
        </div>

        {locationError && (
          <p
            style={{
              color: "#f59e0b",
              fontSize: "12px",
              textAlign: "center",
              marginTop: "12px",
            }}
          >
            ⚠️ {locationError}
          </p>
        )}
      </div>
    );
  }

  // RENDER: Face Register (Sign Up - After OTP)
  if (step === "face-register") {
    return (
      <div style={containerStyle}>
        <h2 style={{ textAlign: "center", color: "#fff", marginBottom: "8px" }}>
          📸 Register Face ID
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "#71717a",
            marginBottom: "20px",
          }}
        >
          This will be used for instant login next time
        </p>

        <div
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: "16px",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", display: "block" }}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>

        {error && (
          <p
            style={{
              color: "#ef4444",
              textAlign: "center",
              marginBottom: "12px",
            }}
          >
            {error}
          </p>
        )}

        <button
          onClick={() => captureAndProcess("register")}
          disabled={isLoading || !cameraActive}
          style={{ ...buttonStyle, opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? "Registering..." : "📷 Capture & Register Face"}
        </button>
      </div>
    );
  }

  // RENDER: OTP Verification
  if (step === "otp") {
    return (
      <div style={containerStyle}>
        <h2 style={{ textAlign: "center", color: "#fff", marginBottom: "8px" }}>
          📧 Check Your Email
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "#71717a",
            marginBottom: "24px",
          }}
        >
          We sent a 6-digit code to {email}
        </p>

        <form onSubmit={handleOtpSubmit}>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="000000"
            maxLength={6}
            style={{
              ...inputStyle,
              textAlign: "center",
              fontSize: "28px",
              letterSpacing: "12px",
            }}
          />

          {error && <p style={{ color: "#ef4444", marginBottom: "12px" }}>{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            style={{ ...buttonStyle, opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? "Verifying..." : "Verify Code"}
          </button>
        </form>
      </div>
    );
  }

  // RENDER: Password (Sign Up)
  if (step === "password") {
    return (
      <div style={containerStyle}>
        <h2 style={{ textAlign: "center", color: "#fff", marginBottom: "8px" }}>
          🔑 Create Password
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "#71717a",
            marginBottom: "24px",
          }}
        >
          Choose a strong password for {email}
        </p>

        <form onSubmit={handlePasswordSubmit}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            style={inputStyle}
          />

          {error && <p style={{ color: "#ef4444", marginBottom: "12px" }}>{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            style={{ ...buttonStyle, opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? "Processing..." : "Continue"}
          </button>
        </form>

        <button
          onClick={() => setStep("email")}
          style={{
            width: "100%",
            marginTop: "12px",
            background: "none",
            border: "none",
            color: "#71717a",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  // RENDER: Email Entry
  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: "center", color: "#fff", marginBottom: "8px" }}>
        {mode === "signup" ? "Create Account" : "Sign In"}
      </h2>
      <p style={{ textAlign: "center", color: "#71717a", marginBottom: "24px" }}>
        {mode === "signup" ? "Start with your email address" : "Enter your email to continue"}
      </p>

      <form onSubmit={handleEmailSubmit}>
        <label style={labelStyle}>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          style={inputStyle}
        />

        {requireLocation && !location && (
          <p style={{ color: "#f59e0b", fontSize: "14px", marginBottom: "12px" }}>
            📍 Fetching your location...
          </p>
        )}

        {error && <p style={{ color: "#ef4444", marginBottom: "12px" }}>{error}</p>}

        <button
          type="submit"
          disabled={isLoading || (requireLocation && !location)}
          style={{ ...buttonStyle, opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? "Processing..." : "Continue"}
        </button>
      </form>

      <p
        style={{
          textAlign: "center",
          color: "#52525b",
          fontSize: "12px",
          marginTop: "20px",
        }}
      >
        🔒 Protected by IzzU Security
      </p>
    </div>
  );
}
