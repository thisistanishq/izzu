"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Lock, Save, Settings as SettingsIcon, Users } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

type SettingsTab = "general" | "team" | "security" | "danger";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [projectName, setProjectName] = useState("IzzU Demo Project");
  const [projectSlug, setProjectSlug] = useState("izzu-demo");
  const [saving, setSaving] = useState(false);

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (showCamera) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [showCamera, startCamera, stopCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureAndRegister = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setCapturing(true);

    // Capture frame
    const context = canvasRef.current.getContext("2d");
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;

      const formData = new FormData();
      formData.append("file", blob, "face.jpg");
      // In a real app, getUserID from session. Using demo ID.
      formData.append("user_id", "demo-user-id");

      try {
        const res = await fetch("/api/v1/auth/face/register", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          alert("✅ Face Registered Successfully with Anti-Spoofing check!");
          setShowCamera(false);
        } else {
          const d = await res.json();
          alert(`Error: ${d.detail || d.error || "Failed"}`);
        }
      } catch (_err) {
        alert("Upload failed");
      } finally {
        setCapturing(false);
      }
    }, "image/jpeg");
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "team", label: "Team", icon: Users },
    { id: "security", label: "Security", icon: Lock },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
  ];

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-zinc-400 text-sm">Manage your project configuration and preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeSettingsTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6">
        {activeTab === "general" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
              <p className="text-xs text-zinc-500 mt-1.5">
                This is the display name for your project.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Project Slug</label>
              <div className="flex items-center">
                <span className="bg-zinc-800 border border-zinc-700 rounded-l-lg px-4 py-2.5 text-zinc-500 text-sm">
                  izzu.dev/
                </span>
                <input
                  type="text"
                  value={projectSlug}
                  onChange={(e) =>
                    setProjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  className="flex-1 bg-zinc-900 border border-l-0 border-zinc-800 rounded-r-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1.5">
                Used in URLs and API endpoints. Lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-800">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "team" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">Team management coming soon</p>
            <p className="text-zinc-600 text-sm mt-1">Invite collaborators and manage roles.</p>
          </motion.div>
        )}

        {activeTab === "security" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Face ID Section (Python) */}
            <div className="p-5 bg-gradient-to-r from-emerald-600/10 to-teal-600/10 rounded-xl border border-emerald-500/20">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-lg">
                      <svg
                        className="w-6 h-6 text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-100">Face ID Surveillance (Python)</p>
                      <p className="text-sm text-zinc-400 mt-1">
                        Register your face for the advanced biometric security layer.
                      </p>
                    </div>
                  </div>
                  {!showCamera && (
                    <button
                      onClick={() => setShowCamera(true)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors"
                    >
                      Setup Face ID
                    </button>
                  )}
                </div>

                {showCamera && (
                  <div className="mt-4 bg-black rounded-lg overflow-hidden border border-zinc-700 relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full aspect-video object-cover"
                    />
                    {/* Hidden canvas for capturing image */}
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                    <div className="absolute bottom-4 left-0 w-full flex justify-center gap-3">
                      <button
                        onClick={captureAndRegister}
                        disabled={capturing}
                        className="px-6 py-2 bg-white text-black rounded-full font-bold shadow-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
                      >
                        {capturing ? "Processing..." : "Capture & Register"}
                      </button>
                      <button
                        onClick={() => {
                          setShowCamera(false);
                          stopCamera();
                        }}
                        className="px-4 py-2 bg-black/50 text-white backdrop-blur-md rounded-full font-medium border border-white/20 hover:bg-black/70"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div>
                <p className="font-medium text-zinc-200">Two-Factor Authentication</p>
                <p className="text-sm text-zinc-500">
                  Add an extra layer of security to your account.
                </p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors">
                Enable 2FA
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <div>
                <p className="font-medium text-zinc-200">Session Management</p>
                <p className="text-sm text-zinc-500">View and revoke active sessions.</p>
              </div>
              <button className="px-4 py-2 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
                View Sessions
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "danger" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-300">Delete Project</p>
                  <p className="text-sm text-red-400/80 mt-1">
                    Permanently delete this project and all associated data. This action cannot be
                    undone.
                  </p>
                  <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-500 transition-colors">
                    Delete Project
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
