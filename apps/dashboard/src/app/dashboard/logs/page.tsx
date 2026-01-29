"use client";

import { motion } from "framer-motion";
import { AlertCircle, Key, LogIn, LogOut, RefreshCw, Settings, Shield, User } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

interface AuditLog {
  id: string;
  action: string;
  actorType: string;
  actorId: string | null;
  targetType: string | null;
  targetId: string | null;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  projectName: string;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  "user.login": LogIn,
  "user.logout": LogOut,
  "user.signup": User,
  "key.created": Key,
  "key.revoked": Key,
  "settings.updated": Settings,
  default: Shield,
};

const ACTION_COLORS: Record<string, string> = {
  "user.login": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "user.logout": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  "user.signup": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "key.created": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "key.revoked": "bg-red-500/10 text-red-400 border-red-500/20",
  "settings.updated": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  default: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const fetchLogs = () => {
    setLoading(true);
    fetch("/api/v1/logs/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.logs) setLogs(data.logs);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const getIcon = (action: string) => {
    return ACTION_ICONS[action] || ACTION_ICONS.default;
  };

  const getColor = (action: string) => {
    return ACTION_COLORS[action] || ACTION_COLORS.default;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Audit Logs</h1>
          <p className="text-zinc-400 text-sm">
            Track all security events and user actions in your project.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Logs Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800" />

        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-12 h-12 bg-zinc-800 rounded-full shrink-0" />
                <div className="flex-1 bg-zinc-900 rounded-xl h-20" />
              </div>
            ))
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400">No audit logs yet</p>
              <p className="text-zinc-600 text-sm mt-1">
                Events will appear here as users interact with your project.
              </p>
            </div>
          ) : (
            logs.map((log, index) => {
              const Icon = getIcon(log.action);
              const colorClass = getColor(log.action);

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-4 relative"
                >
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${colorClass} z-10 bg-black`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 hover:bg-zinc-900/60 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-medium text-zinc-200">{log.action}</span>
                        {log.actorId && (
                          <span className="text-zinc-500 ml-2 text-sm">
                            by {log.actorType}: {log.actorId.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-600 font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {log.metadata && (
                      <div className="mt-2 text-xs text-zinc-500 font-mono bg-zinc-950 rounded p-2 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-zinc-600">
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      {log.userAgent && (
                        <span className="truncate max-w-xs">UA: {log.userAgent}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
