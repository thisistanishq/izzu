"use client";

import { motion } from "framer-motion";
import { Check, Copy, Plus, Trash2, Webhook, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface WebhookData {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string | null;
  lastTriggeredAt: string | null;
  createdAt: string;
  projectName: string;
}

const EVENT_COLORS: Record<string, string> = {
  "user.signup": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "user.login": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "user.updated": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "user.deleted": "bg-red-500/20 text-red-400 border-red-500/30",
  "key.created": "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const fetchWebhooks = () => {
    setLoading(true);
    fetch("/api/v1/webhooks/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.webhooks) setWebhooks(data.webhooks);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const copySecret = async (id: string, secret: string) => {
    await navigator.clipboard.writeText(secret);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Webhooks</h1>
          <p className="text-zinc-400 text-sm">
            Receive real-time event notifications via HTTP callbacks.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium text-sm hover:bg-zinc-200 transition-colors">
          <Plus className="w-4 h-4" />
          Add Endpoint
        </button>
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <Zap className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-200 font-medium">Event-Driven Architecture</p>
          <p className="text-xs text-blue-400/80 mt-1">
            Webhooks notify your server when events occur. Use them to sync data, send
            notifications, or trigger workflows.
          </p>
        </div>
      </div>

      {/* Webhooks List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-zinc-900 rounded-xl animate-pulse" />
          ))
        ) : webhooks.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
            <Webhook className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No webhooks configured</p>
            <p className="text-zinc-600 text-sm mt-1">Add an endpoint to start receiving events.</p>
          </div>
        ) : (
          webhooks.map((webhook, i) => (
            <motion.div
              key={webhook.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 group hover:bg-zinc-900/60 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${webhook.isActive ? "bg-emerald-400" : "bg-zinc-600"}`}
                    />
                    <span className="font-mono text-sm text-zinc-200">{webhook.url}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className={`px-2 py-0.5 rounded text-xs border ${EVENT_COLORS[event] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {webhook.secret && (
                    <button
                      onClick={() => copySecret(webhook.id, webhook.secret!)}
                      className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                      title="Copy Secret"
                    >
                      {copiedId === webhook.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 text-xs text-zinc-600">
                <span>Created {new Date(webhook.createdAt).toLocaleDateString()}</span>
                {webhook.lastTriggeredAt && (
                  <span>Last triggered {new Date(webhook.lastTriggeredAt).toLocaleString()}</span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
