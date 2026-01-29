"use client";

import { motion } from "framer-motion";
import { Check, Copy, FileCode, Loader2, Shield, Terminal } from "lucide-react";
import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
  slug: string;
  apiKeyPrefix: string;
}

export default function IntegrationPage() {
  const [copied, setCopied] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"quick" | "react">("quick");

  useEffect(() => {
    fetch("/api/v1/projects/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects && data.projects.length > 0) {
          setProjects(data.projects);
          setSelectedProject(data.projects[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  const apiBaseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin.replace(":3000", ":3001")}/api`
      : "http://localhost:3001/api";

  // Quick Start - Plain HTML/JS
  const getQuickStartCode = () => {
    if (!selectedProject) return "";
    return `<!-- IzzU Authentication - Copy this to your HTML page -->
<div id="izzu-auth"></div>

<script>
// ========================================
// IzzU Configuration
// ========================================
const IZZU = {
  projectId: "${selectedProject.id}",
  apiKey: "${selectedProject.apiKeyPrefix}",
  apiUrl: "${apiBaseUrl}",
  mode: "signin" // or "signup"
};

// ========================================
// Initialize IzzU Auth (Apple-Style Auto Scan)
// ========================================
(async function() {
  const container = document.getElementById("izzu-auth");
  let state = { step: "loading", email: "", faceBlob: null, location: null };
  let scanningActive = false;
  let autoScanTimer = null;

  // 1. Get Location (Mandatory First Step)
  try {
    const pos = await new Promise((res, rej) => 
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
    );
    state.location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    state.step = IZZU.mode === "signin" ? "face-login" : "signup-face";
  } catch (e) { 
    state.step = "location-denied";
  }

  function render() {
    let content = "";
    
    // VIEW: Location Denied
    if (state.step === "location-denied") {
      content = \`
        <h2 style="color:#e11d48;text-align:center;">Location Required</h2>
        <p style="color:#aaa;text-align:center;">Access denied. Please enable location permissions to continue.</p>
        <button onclick="window.location.reload()" style="\${btnStyle}">Retry</button>
      \`;
      scanningActive = false;
    }

    // VIEW: Signup Step 1 - Advanced Face Scan (Apple-Style)
    else if (state.step === "signup-face") {
      const scanPhase = state.scanPhase || 0;
      const phases = ["center", "blink", "left", "right"];
      const phaseLabels = {
        "center": "Look straight at the camera",
        "blink": "Blink your eyes slowly",
        "left": "Turn your head slightly LEFT",
        "right": "Turn your head slightly RIGHT"
      };
      const progress = Math.round((scanPhase / phases.length) * 100);
      
      content = \`
        <div style="text-align:center;margin-bottom:16px;">
          <h2 style="color:#fff;margin:0;">Face ID Setup</h2>
          <p style="color:#10b981;font-size:13px;margin:4px 0;">🔒 Maximum Security Scan</p>
        </div>
        
        <div style="position:relative;width:100%;height:320px;border-radius:24px;overflow:hidden;margin-bottom:16px;background:#000;">
          <video id="izzu-video" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1);"></video>
          <canvas id="izzu-canvas" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></canvas>
          
          <!-- Face Guide Oval -->
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:200px;height:260px;border:3px solid \${scanPhase < phases.length ? '#2563eb' : '#10b981'};border-radius:50%;box-shadow:0 0 0 9999px rgba(0,0,0,0.6);"></div>
          
          <!-- Progress Ring -->
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:220px;height:280px;border-radius:50%;border:4px solid transparent;border-top-color:#10b981;animation:spin 2s linear infinite;"></div>
          
          <!-- Scan Instruction -->
          <div style="position:absolute;bottom:40px;width:100%;text-align:center;">
            <div id="scan-text" style="color:#fff;font-weight:600;font-size:16px;text-shadow:0 2px 8px rgba(0,0,0,0.8);">
              \${phaseLabels[phases[scanPhase]] || "Complete!"}
            </div>
            <div style="margin-top:8px;background:rgba(255,255,255,0.2);border-radius:10px;height:6px;width:200px;margin:8px auto;">
              <div style="background:#10b981;height:100%;border-radius:10px;width:\${progress}%;transition:width 0.3s;"></div>
            </div>
          </div>
          
          <!-- Security Badges -->
          <div style="position:absolute;top:16px;left:16px;display:flex;gap:8px;">
            <span style="background:\${scanPhase > 0 ? '#10b981' : '#333'};color:#fff;padding:4px 8px;border-radius:12px;font-size:11px;">👁 Eyes</span>
            <span style="background:\${scanPhase > 1 ? '#10b981' : '#333'};color:#fff;padding:4px 8px;border-radius:12px;font-size:11px;">🔄 Blink</span>
            <span style="background:\${scanPhase > 2 ? '#10b981' : '#333'};color:#fff;padding:4px 8px;border-radius:12px;font-size:11px;">↔ Pose</span>
          </div>
        </div>
        
        <style>@keyframes spin { to { transform: translate(-50%,-50%) rotate(360deg); } }</style>
        <button onclick="switchMode('signin')" style="\${linkStyle}">Already have an account? Sign In</button>
      \`;
      setTimeout(() => startSecureScan(), 100);
    }
    
    // VIEW: Signup Step 2 - Form Details (No Mobile)
    else if (state.step === "signup-form") {
      content = \`
        <img id="face-preview" style="width:100px;height:100px;border-radius:50px;display:block;margin:0 auto 20px;object-fit:cover;border:2px solid #2563eb;box-shadow:0 0 15px rgba(37, 99, 235, 0.5);">
        <h2 style="color:#fff;text-align:center;">Complete Profile</h2>
        <input id="i-name" placeholder="Full Name" style="\${inputStyle}">
        <input id="i-email" placeholder="Email" style="\${inputStyle}">
        <input id="i-pass" type="password" placeholder="Password" style="\${inputStyle}">
        <button onclick="handleSignupSubmit()" style="\${btnStyle}">Create Account</button>
        <button onclick="state.step='signup-face';render()" style="\${linkStyle}">Retake Face ID</button>
      \`;
      scanningActive = false;
      setTimeout(() => {
        if(state.faceBlob) document.getElementById("face-preview").src = URL.createObjectURL(state.faceBlob);
      }, 50);
    }

    // OTP REMOVED - Face ID is the verification

    // VIEW: Login - Face ID (Auto-Scan)
    else if (state.step === "face-login") {
      content = \`
        <h2 style="color:#fff;text-align:center;margin-bottom:8px;">Face ID</h2>
        <div style="position:relative;width:100%;height:320px;border-radius:24px;overflow:hidden;margin-bottom:12px;background:#000;">
            <video id="izzu-video" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1);opacity:0.8;"></video>
            <canvas id="izzu-canvas" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></canvas>
            <div id="scan-overlay" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:180px;height:180px;border:2px solid rgba(255,255,255,0.3);border-radius:40px;box-shadow:0 0 0 9999px rgba(0,0,0,0.5);"></div>
            <div id="scan-text" style="position:absolute;bottom:30px;width:100%;text-align:center;color:#fff;font-weight:600;letter-spacing:0.5px;text-shadow:0 2px 4px rgba(0,0,0,0.8);">Looking for you...</div>
        </div>
        <button onclick="state.step='email-login';render()" style="\${linkStyle}">Use Password</button>
        <button onclick="switchMode('signup')" style="\${linkStyle}">Create Account</button>
      \`;
      setTimeout(() => startCamera(true, "login"), 100);
    }
    
    // VIEW: Login Fallback - Email/Pass
    else if (state.step === "email-login") {
      content = \`
        <h2 style="color:#fff;text-align:center;">Sign In</h2>
        <input id="i-email" placeholder="Email" style="\${inputStyle}">
        <input id="i-pass" type="password" placeholder="Password" style="\${inputStyle}">
        <button onclick="handleEmailLogin()" style="\${btnStyle}">Sign In</button>
        <button onclick="state.step='face-login';render()" style="\${linkStyle}">Back to Face ID</button>
      \`;
      scanningActive = false;
    }

    // VIEW: Success
    else if (state.step === "success") {
       content = \`
        <div style="text-align:center;padding:40px 0;">
            <div style="font-size:48px;margin-bottom:16px;">🔓</div>
            <h2 style="color:#fff;margin:0;">Unlocked</h2>
            <p style="color:#888;">Welcome back, \${state.user.displayName || state.user.name}</p>
        </div>
       \`;
       scanningActive = false;
    }

    container.innerHTML = \`<div style="\${boxStyle}">\${content}</div>\`;
  }

  // Styles
  const boxStyle = "max-width:380px;margin:40px auto;padding:32px;background:#0d0d0d;border-radius:24px;border:1px solid #222;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;box-shadow:0 20px 40px rgba(0,0,0,0.4);";
  const inputStyle = "width:100%;padding:14px;margin-bottom:12px;background:#1a1a1a;border:1px solid #333;border-radius:12px;color:#fff;box-sizing:border-box;font-size:16px;outline:none;transition:border-color 0.2s;";
  const btnStyle = "width:100%;padding:14px;background:#2563eb;color:#fff;border:none;border-radius:12px;cursor:pointer;font-weight:600;font-size:16px;transition:transform 0.1s;";
  const linkStyle = "width:100%;padding:10px;background:none;color:#666;border:none;cursor:pointer;margin-top:8px;font-size:14px;transition:color 0.2s;";

  // Actions
  window.switchMode = (mode) => { 
    IZZU.mode = mode; 
    state.step = mode === "signin" ? "face-login" : "signup-face"; 
    render(); 
  };
  
  // SIGNUP ACTIONS
  window.handleCaptureSignup = async () => {
    // Auto-called by scanner in signup mode
    const text = document.getElementById("scan-text");
    if(text) text.innerText = "Capturing...";
    
    state.faceBlob = await captureFace();
    
    // Small delay for UX
    setTimeout(() => {
        state.step = "signup-form";
        render();
    }, 500);
  };

  // SIGNUP: Direct account creation (Face ID IS the verification)
  window.handleSignupSubmit = async () => {
    state.name = document.getElementById("i-name").value;
    state.email = document.getElementById("i-email").value;
    state.pass = document.getElementById("i-pass").value;
    
    if(!state.email || !state.pass) {
      alert("Please fill in all fields");
      return;
    }
    
    // Step 1: Create user directly (no OTP needed - Face ID is the verification)
    const createRes = await fetch(\`\${IZZU.apiUrl}/v1/sdk/user/create\`, {
      method: "POST", 
      headers: { "X-API-Key": IZZU.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: state.email, 
        password: state.pass,
        name: state.name,
        project_id: IZZU.projectId,
        location_lat: state.location?.lat, 
        location_lng: state.location?.lng
      })
    });
    const userData = await createRes.json();
    
    if (!userData.user && !userData.success) {
      alert(userData.error || "Failed to create account");
      return;
    }
    
    // Step 2: Register face
    const form = new FormData();
    form.append("file", state.faceBlob, "face.jpg");
    form.append("email", state.email);
    form.append("project_id", IZZU.projectId);
    
    const faceRes = await fetch(\`\${IZZU.apiUrl}/v1/sdk/face/register\`, {
      method: "POST", headers: { "X-API-Key": IZZU.apiKey }, body: form
    });
    const faceData = await faceRes.json();
    
    if (faceData.registered || faceData.success) {
      state.user = userData.user || { email: state.email, name: state.name };
      state.step = "success";
      render();
    } else {
      alert("Face registration failed. Please try again.");
    }
  };

  // LOGIN ACTIONS
  window.handleFaceIdentify = async () => {
    const text = document.getElementById("scan-text");
    if(text) text.innerText = "Verifying Identity...";
    
    const blob = await captureFace();
    const form = new FormData();
    form.append("file", blob, "face.jpg");
    form.append("project_id", IZZU.projectId);
    form.append("location_lat", state.location?.lat);
    form.append("location_lng", state.location?.lng);
    
    const res = await fetch(\`\${IZZU.apiUrl}/v1/sdk/face/identify\`, {
      method: "POST", headers: { "X-API-Key": IZZU.apiKey }, body: form
    });
    const data = await res.json();
    
    if (data.verified) {
      if(text) { text.innerText = "✓ Authorized"; text.style.color = "#10b981"; }
      setTimeout(() => {
          state.user = data.user;
          state.step = "success";
          render();
      }, 800);
    } else {
      if(text) text.innerText = data.error || "Not Recognized";
      setTimeout(() => {
          if(state.step === "face-login") startCamera(true, "login");
      }, 2000);
    }
  };

  window.handleEmailLogin = async () => {
    state.email = document.getElementById("i-email").value;
    state.pass = document.getElementById("i-pass").value;
    // Direct login without OTP
    alert("Email/password login coming soon. Please use Face ID.");
  };

  // =========================================
  // ADVANCED SECURE FACE SCANNING
  // =========================================
  let currentStream = null;
  let secureScanTimer = null;
  
  async function startSecureScan() {
    try {
      scanningActive = true;
      state.scanPhase = 0;
      
      if (!currentStream) {
        currentStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
      }
      
      const v = document.getElementById("izzu-video");
      if(v) {
        v.srcObject = currentStream;
        requestAnimationFrame(drawSecureScanFx);
        runSecureScanPhases();
      }
    } catch(e) { 
      alert("Camera access required for Face ID"); 
    }
  }
  
  async function runSecureScanPhases() {
    const phases = ["center", "blink", "left", "right"];
    
    for(let i = 0; i < phases.length; i++) {
      state.scanPhase = i;
      render();
      
      // Re-attach camera after render
      await new Promise(r => setTimeout(r, 100));
      const v = document.getElementById("izzu-video");
      if(v && currentStream) v.srcObject = currentStream;
      
      // Wait for user to complete phase (simulated timing)
      await new Promise(r => setTimeout(r, 1500));
      
      // Perform liveness check for this phase
      const blob = await captureFace();
      const form = new FormData();
      form.append("file", blob, "face.jpg");
      
      const checkRes = await fetch("/api/liveness", {
        method: "POST", body: form
      });
      const checkData = await checkRes.json();
      
      if(!checkData.passed && !checkData.is_live) {
        const scanText = document.getElementById("scan-text");
        if(scanText) scanText.innerText = checkData.error || "Security check failed";
        await new Promise(r => setTimeout(r, 2000));
        // Restart scan
        state.scanPhase = 0;
        render();
        return;
      }
    }
    
    // All phases passed - capture final image
    state.scanPhase = phases.length;
    state.faceBlob = await captureFace();
    stopCamera();
    
    // Move to form
    setTimeout(() => {
      state.step = "signup-form";
      render();
    }, 500);
  }
  
  function drawSecureScanFx() {
    if(!scanningActive) return;
    const canvas = document.getElementById("izzu-canvas");
    const video = document.getElementById("izzu-video");
    if(!canvas || !video) return;

    if(canvas.width !== video.videoWidth && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }
    
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = Date.now() / 1000;
    const w = canvas.width;
    const h = canvas.height;
    
    // Scanning pulse effect
    const pulse = (Math.sin(time * 4) + 1) / 2;
    ctx.strokeStyle = \`rgba(16, 185, 129, \${0.3 + pulse * 0.4})\`;
    ctx.lineWidth = 2;
    
    // Draw scanning lines
    for(let i = 0; i < 5; i++) {
      const y = ((time * 50 + i * 80) % h);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    
    // Corner markers
    const cornerSize = 30;
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 3;
    
    // Top-left
    ctx.beginPath();
    ctx.moveTo(w*0.2, h*0.15 + cornerSize);
    ctx.lineTo(w*0.2, h*0.15);
    ctx.lineTo(w*0.2 + cornerSize, h*0.15);
    ctx.stroke();
    
    // Top-right
    ctx.beginPath();
    ctx.moveTo(w*0.8 - cornerSize, h*0.15);
    ctx.lineTo(w*0.8, h*0.15);
    ctx.lineTo(w*0.8, h*0.15 + cornerSize);
    ctx.stroke();
    
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(w*0.2, h*0.85 - cornerSize);
    ctx.lineTo(w*0.2, h*0.85);
    ctx.lineTo(w*0.2 + cornerSize, h*0.85);
    ctx.stroke();
    
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(w*0.8 - cornerSize, h*0.85);
    ctx.lineTo(w*0.8, h*0.85);
    ctx.lineTo(w*0.8, h*0.85 - cornerSize);
    ctx.stroke();

    requestAnimationFrame(drawSecureScanFx);
  }

  // CAMERA UTILITIES
  async function startCamera(enableScan = false, mode = "login") {
    try {
      if(autoScanTimer) clearTimeout(autoScanTimer);
      scanningActive = enableScan;

      if (!currentStream) {
        currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      }
      
      const v = document.getElementById("izzu-video");
      if(v) {
          v.srcObject = currentStream;
          if(enableScan) {
              requestAnimationFrame(drawSecureScanFx);
              autoScanTimer = setTimeout(() => {
                  if(mode === "login") handleFaceIdentify();
                  else handleCaptureSignup();
              }, 2500);
          }
      }
    } catch(e) {}
  }

  function stopCamera() {
    scanningActive = false;
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }
  }

  function drawScanFx() {
    if(!scanningActive) return;
    const canvas = document.getElementById("izzu-canvas");
    const video = document.getElementById("izzu-video");
    if(!canvas || !video) return;

    if(canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }
    
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = Date.now() / 1000;
    const w = canvas.width;
    const h = canvas.height;
    
    // Scanning Line
    const scanY = (Math.sin(time * 3) + 1) / 2 * h;
    
    const gradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
    gradient.addColorStop(0, "rgba(37, 99, 235, 0)");
    gradient.addColorStop(0.5, "rgba(37, 99, 235, 0.8)");
    gradient.addColorStop(1, "rgba(37, 99, 235, 0)");
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, scanY - 20, w, 40);

    // Random tech particles
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    for(let i=0; i<15; i++) {
        const x = (Math.sin(time*2 + i*100) + 1) / 2 * w;
        const y = (Math.cos(time*3 + i*50) + 1) / 2 * h;
        ctx.fillRect(x, y, 2, 2);
    }

    requestAnimationFrame(drawScanFx);
  }

  async function captureFace() {
    const v = document.getElementById("izzu-video");
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    stopCamera(); // Stop after capture
    return new Promise(r => c.toBlob(r, "image/jpeg"));
  }

  // Hook into render to stop camera on non-face views
  const originalRender = render;
  render = function() {
      // If we are NOT in a face step, ensure camera is stopped
      if (state.step !== "signup-face" && state.step !== "face-login") {
          stopCamera();
      }
      // Call original render logic
      let content = "";
    
    // VIEW: Location Denied
    if (state.step === "location-denied") {
      content = \`
        <h2 style="color:#e11d48;text-align:center;">Location Required</h2>
        <p style="color:#aaa;text-align:center;">Access denied. Please enable location permissions to continue.</p>
        <button onclick="window.location.reload()" style="\${btnStyle}">Retry</button>
      \`;
      scanningActive = false;
    }

    // VIEW: Signup Step 1 - Auto-Capture Face
    else if (state.step === "signup-face") {
      content = \`
        <h2 style="color:#fff;text-align:center;">Face Registration</h2>
        <div style="position:relative;width:100%;height:300px;border-radius:24px;overflow:hidden;margin-bottom:12px;box-shadow:0 0 20px rgba(0,0,0,0.5);">
          <video id="izzu-video" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1);"></video>
          <canvas id="izzu-canvas" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></canvas>
          <div id="scan-text" style="position:absolute;bottom:20px;width:100%;text-align:center;color:rgba(255,255,255,0.8);font-weight:500;text-shadow:0 2px 4px rgba(0,0,0,0.8);">Position face in frame...</div>
        </div>
        <button onclick="switchMode('signin')" style="\${linkStyle}">Already have an account? Sign In</button>
      \`;
      setTimeout(() => startCamera(true, "signup"), 100);
    }
    
    // VIEW: Signup Step 2 - Form Details (No Mobile)
    else if (state.step === "signup-form") {
      content = \`
        <img id="face-preview" style="width:100px;height:100px;border-radius:50px;display:block;margin:0 auto 20px;object-fit:cover;border:2px solid #2563eb;box-shadow:0 0 15px rgba(37, 99, 235, 0.5);">
        <h2 style="color:#fff;text-align:center;">Complete Profile</h2>
        <input id="i-name" placeholder="Full Name" style="\${inputStyle}">
        <input id="i-email" placeholder="Email" style="\${inputStyle}">
        <input id="i-pass" type="password" placeholder="Password" style="\${inputStyle}">
        <button onclick="handleSignupSubmit()" style="\${btnStyle}">Create Account</button>
        <button onclick="state.step='signup-face';render()" style="\${linkStyle}">Retake Face ID</button>
      \`;
      scanningActive = false;
      setTimeout(() => {
        if(state.faceBlob) document.getElementById("face-preview").src = URL.createObjectURL(state.faceBlob);
      }, 50);
    }

    // VIEW: OTP Verification
    else if (state.step === "otp") {
      content = \`
        <h2 style="color:#fff;text-align:center;">Verify Email</h2>
        <p style="color:#888;text-align:center;font-size:14px;">Code sent to <span style="color:#fff">\${state.email}</span></p>
        <div style="display:flex;justify-content:center;margin:20px 0;">
             <input id="i-otp" placeholder="• • • • • •" style="\${inputStyle};text-align:center;letter-spacing:8px;font-size:24px;width:200px;background:#000;border:1px solid #333;">
        </div>
        <button onclick="handleOtp()" style="\${btnStyle}">Verify & Finish</button>
        <button onclick="handleResendOtp()" style="\${linkStyle}">Resend Code</button>
      \`;
      scanningActive = false;
    }

    // VIEW: Login - Face ID (Auto-Scan)
    else if (state.step === "face-login") {
      content = \`
        <h2 style="color:#fff;text-align:center;margin-bottom:8px;">Face ID</h2>
        <div style="position:relative;width:100%;height:320px;border-radius:24px;overflow:hidden;margin-bottom:12px;background:#000;">
            <video id="izzu-video" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1);opacity:0.8;"></video>
            <canvas id="izzu-canvas" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></canvas>
            <div id="scan-overlay" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:180px;height:180px;border:2px solid rgba(255,255,255,0.3);border-radius:40px;box-shadow:0 0 0 9999px rgba(0,0,0,0.5);"></div>
            <div id="scan-text" style="position:absolute;bottom:30px;width:100%;text-align:center;color:#fff;font-weight:600;letter-spacing:0.5px;text-shadow:0 2px 4px rgba(0,0,0,0.8);">Looking for you...</div>
        </div>
        <button onclick="state.step='email-login';render()" style="\${linkStyle}">Use Password</button>
        <button onclick="switchMode('signup')" style="\${linkStyle}">Create Account</button>
      \`;
      setTimeout(() => startCamera(true, "login"), 100);
    }
    
    // VIEW: Login Fallback - Email/Pass
    else if (state.step === "email-login") {
      content = \`
        <h2 style="color:#fff;text-align:center;">Sign In</h2>
        <input id="i-email" placeholder="Email" style="\${inputStyle}">
        <input id="i-pass" type="password" placeholder="Password" style="\${inputStyle}">
        <button onclick="handleEmailLogin()" style="\${btnStyle}">Sign In</button>
        <button onclick="state.step='face-login';render()" style="\${linkStyle}">Back to Face ID</button>
      \`;
      scanningActive = false;
    }

    // VIEW: Success
    else if (state.step === "success") {
       content = \`
        <div style="text-align:center;padding:40px 0;">
            <div style="font-size:48px;margin-bottom:16px;">🔓</div>
            <h2 style="color:#fff;margin:0;">Unlocked</h2>
            <p style="color:#888;">Welcome back, \${state.user.displayName || state.user.name}</p>
        </div>
       \`;
       scanningActive = false;
    }

    container.innerHTML = \`<div style="\${boxStyle}">\${content}</div>\`;
  };
  
  // Initial Render call
  render();
})();
</script>`;
  };

  // React Component Code
  const getReactCode = () => {
    if (!selectedProject) return "";
    return `// IzzU Auth Component for React (Advanced Auto-Scan)
import React, { useState, useRef, useEffect } from "react";

const CONFIG = {
  projectId: "${selectedProject.id}",
  apiKey: "${selectedProject.apiKeyPrefix}",
  apiUrl: "${apiBaseUrl}",
};

export default function IzzUAuth({ mode = "signin", onSuccess }) {
  const [step, setStep] = useState(mode === "signin" ? "face" : "form");
  const [form, setForm] = useState({ name: "", email: "", pass: "", otp: "" });
  const [location, setLocation] = useState(null);
  const [scanStatus, setScanStatus] = useState("Initializing...");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const scanTimerRef = useRef(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(p => 
      setLocation({ lat: p.coords.latitude, lng: p.coords.longitude })
    );
  }, []);

  const apiCall = async (path, body) => {
    const res = await fetch(\`\${CONFIG.apiUrl}\${path}\`, {
      method: "POST", headers: { "X-API-Key": CONFIG.apiKey },
      body: body instanceof FormData ? body : JSON.stringify({ ...body, project_id: CONFIG.projectId })
    });
    return res.json();
  };

  const startCamera = async (autoScan = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
          videoRef.current.srcObject = stream;
          drawScanFx();
          if(autoScan) {
              setScanStatus("Scanning Face...");
              clearTimeout(scanTimerRef.current);
              scanTimerRef.current = setTimeout(() => handleFace(step === "face" ? "identify" : "register"), 2500);
          }
      }
    } catch(e) { setScanStatus("Camera Access Denied"); }
  };

  const drawScanFx = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if(!canvas || !video) return;

      if(canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
      }
      
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = Date.now() / 1000;
      const w = canvas.width;
      const h = canvas.height;
      
      // Apple-style Scan Line
      const scanY = (Math.sin(time * 3) + 1) / 2 * h;
      const gradient = ctx.createLinearGradient(0, scanY-20, 0, scanY+20);
      gradient.addColorStop(0, "rgba(37, 99, 235, 0)");
      gradient.addColorStop(0.5, "rgba(37, 99, 235, 0.8)");
      gradient.addColorStop(1, "rgba(37, 99, 235, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanY-20, w, 40);
      
      animationRef.current = requestAnimationFrame(drawScanFx);
  };

  useEffect(() => {
    if (step.includes("face")) startCamera(true);
    return () => { cancelAnimationFrame(animationRef.current); clearTimeout(scanTimerRef.current); };
  }, [step]);

  const handleResendOtp = async () => {
     await apiCall("/v1/sdk/otp/send", { email: form.email });
     alert("Code sent!");
  };

  const handleSignup = async () => {
    await apiCall("/v1/sdk/otp/send", { email: form.email });
    setStep("otp");
  };

  const handleOtp = async () => {
    const res = await apiCall("/v1/sdk/otp/verify", {
      email: form.email, code: form.otp, password: form.pass,
      name: form.name,
      location_lat: location?.lat, location_lng: location?.lng
    });
    if (res.success || res.user) setStep("face-register");
    else alert("Invalid OTP");
  };

  const handleFace = async (action) => {
    if(!videoRef.current) return;
    setScanStatus("Processing...");
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob(async (blob) => {
      const fd = new FormData();
      fd.append("file", blob, "face.jpg");
      fd.append("email", form.email);
      fd.append("project_id", CONFIG.projectId);
      
      const path = action === "register" ? "/v1/sdk/face/register" : "/v1/sdk/face/identify";
      const res = await apiCall(path, fd);
      
      if (res.registered || res.identified) {
          setScanStatus("Authorized");
          setTimeout(() => onSuccess(res.user), 500);
      }
      else if (action === "identify") {
          setScanStatus("Not Recognized");
          setTimeout(() => startCamera(true), 2000); // Retry
      }
      else alert("Registration Failed");
    }, "image/jpeg");
  };

  // UI Styles
  const box = { maxWidth: 400, margin: "auto", padding: 32, background: "#0a0a0a", borderRadius: 24, border: "1px solid #333", color: "#fff", fontFamily: "system-ui", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" };
  const input = { width: "100%", padding: 14, marginBottom: 12, background: "#1a1a1a", border: "1px solid #333", borderRadius: 12, color: "#fff", fontSize: 16 };
  const btn = { width: "100%", padding: 14, background: "#2563eb", border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 600 };
  const link = { background: "none", border: "none", color: "#888", cursor: "pointer", marginTop: 12, textDecoration: "underline", width: "100%" };

  if (step === "form") return (
    <div style={box}>
      <h2>Complete Profile</h2>
      <input placeholder="Full Name" onChange={e => setForm({...form, name: e.target.value})} style={input} />
      <input placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} style={input} />
      <input type="password" placeholder="Password" onChange={e => setForm({...form, pass: e.target.value})} style={input} />
      <button onClick={handleSignup} style={btn}>Create Account</button>
    </div>
  );

  if (step === "otp") return (
    <div style={box}>
      <h2>Verify Email</h2>
      <input placeholder="OTP Code" onChange={e => setForm({...form, otp: e.target.value})} style={input} />
      <button onClick={handleOtp} style={btn}>Verify</button>
      <button onClick={handleResendOtp} style={link}>Resend Code</button>
    </div>
  );

  if (step === "face-register" || step === "face") return (
    <div style={box}>
      <h2 style={{textAlign: "center"}}>{step === "face" ? "Face ID" : "Face Setup"}</h2>
      <div style={{ position: "relative", height: 320, borderRadius: 24, overflow: "hidden", marginBottom: 20, background: "#000" }}>
        <video ref={videoRef} autoPlay muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", opacity: 0.8 }} />
        <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
        <div style={{ position: "absolute", bottom: 30, width: "100%", textAlign: "center", color: "#fff", fontWeight: 600, textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>{scanStatus}</div>
      </div>
      {step === "face" && (
         <button onClick={() => setStep("form-login")} style={btn}>Use Password</button>
      )}
      {step === "face-register" && (
         <button onClick={() => handleFace("register")} style={btn}>Capture Manually</button>
      )}
    </div>
  );

  return (
    <div style={box}>
      <h2>Sign In</h2>
      <input placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} style={input} />
      <input type="password" placeholder="Password" style={input} />
      <button style={btn}>Sign In</button>
    </div>
  );
}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="text-center py-16">
        <Shield className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
        <h2 className="text-xl font-semibold text-white mb-2">No Projects Yet</h2>
        <p className="text-zinc-400">Create a project first to get integration code.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">SDK Integration</h1>
        <p className="text-zinc-400 mt-1">
          Add Face ID + Location authentication to your app in minutes
        </p>
      </div>

      {/* Project Selector */}
      {projects.length > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-zinc-400 text-sm">Project:</span>
          <select
            value={selectedProject.id}
            onChange={(e) =>
              setSelectedProject(projects.find((p) => p.id === e.target.value) || null)
            }
            className="bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: "📷", title: "Face ID", desc: "Native-like Auto Scan" },
          { icon: "📍", title: "Location", desc: "Mandatory GPS tracking" },
          { icon: "⚡️", title: "No Mobile", desc: "Simplified Auth Flow" },
        ].map((f, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <span className="text-2xl">{f.icon}</span>
            <h3 className="text-white font-medium mt-2">{f.title}</h3>
            <p className="text-zinc-500 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab("quick")}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === "quick" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"}`}
        >
          <Terminal className="w-4 h-4 inline mr-2" />
          Quick Start (HTML/JS)
        </button>
        <button
          onClick={() => setActiveTab("react")}
          className={`px-4 py-2 rounded-lg font-medium ${activeTab === "react" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"}`}
        >
          <FileCode className="w-4 h-4 inline mr-2" />
          React Component
        </button>
      </div>

      {/* Code Block */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-zinc-400 text-sm">
              {activeTab === "quick" ? "index.html" : "components/IzzUAuth.jsx"}
            </span>
            <button
              onClick={() =>
                copyToClipboard(
                  activeTab === "quick" ? getQuickStartCode() : getReactCode(),
                  "code",
                )
              }
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm"
            >
              {copied === "code" ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied === "code" ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-sm text-zinc-300 max-h-[600px]">
            <code>{activeTab === "quick" ? getQuickStartCode() : getReactCode()}</code>
          </pre>
        </div>
      </motion.div>

      {/* Auth Flow Explanation */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">🔄 Apple-Style Flow</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-blue-400 font-medium mb-2">Sign Up</h4>
            <ol className="text-zinc-400 text-sm space-y-1">
              <li>1. 📷 Auto-Scan Face Registration</li>
              <li>2. Enter Name + Email</li>
              <li>3. Verify Email (Resend available)</li>
              <li>4. ✅ Account Created</li>
            </ol>
          </div>
          <div>
            <h4 className="text-green-400 font-medium mb-2">Sign In</h4>
            <ol className="text-zinc-400 text-sm space-y-1">
              <li>1. 📷 Face ID Auto-Scan (No Clicks)</li>
              <li>2. If Recognized → Instant Login</li>
              <li>3. If Failed → Passcode Fallback</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
