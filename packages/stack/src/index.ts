// IzzU Stack SDK v2.0
// Complete Authentication with Face ID, Email+Password, OTP, and Location Tracking

// Legacy export for backward compatibility
export { IzzUAuth, IzzUAuth as FaceAuth } from "./IzzUAuth";
export { IzzUProvider, useIzzU } from "./IzzUProvider";

// Types
export interface IzzUUser {
  id: string;
  email: string;
  faceVerified: boolean;
  location?: { lat: number; lng: number };
}

export interface IzzUConfig {
  projectId: string;
  apiKey: string;
  apiBaseUrl?: string;
}

// Helper for SDK version
export const SDK_VERSION = "2.0.0";
