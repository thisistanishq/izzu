"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

interface IzzUUser {
  id: string;
  email: string;
  faceVerified: boolean;
  location?: { lat: number; lng: number };
}

interface IzzUContextType {
  user: IzzUUser | null;
  isLoading: boolean;
  error: string | null;
  projectId: string;
  apiKey: string;
  apiBaseUrl: string;
  setUser: (user: IzzUUser | null) => void;
}

const IzzUContext = createContext<IzzUContextType | null>(null);

interface IzzUProviderProps {
  children: ReactNode;
  projectId: string;
  apiKey: string;
  apiBaseUrl?: string;
}

export function IzzUProvider({
  children,
  projectId,
  apiKey,
  apiBaseUrl = "http://localhost:3001/api",
}: IzzUProviderProps) {
  const [user, setUser] = useState<IzzUUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, _setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/v1/sdk/session`, {
          headers: {
            "X-Project-ID": projectId,
            "X-API-Key": apiKey,
          },
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("IzzU session check failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, [projectId, apiKey, apiBaseUrl]);

  return (
    <IzzUContext.Provider
      value={{
        user,
        isLoading,
        error,
        projectId,
        apiKey,
        apiBaseUrl,
        setUser,
      }}
    >
      {children}
    </IzzUContext.Provider>
  );
}

export function useIzzU() {
  const context = useContext(IzzUContext);
  if (!context) {
    throw new Error("useIzzU must be used within an IzzUProvider");
  }
  return context;
}

export { IzzUContext };
