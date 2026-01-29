"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Check, Copy, Eye, EyeOff, Key, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ApiKey {
  id: string;
  name: string;
  type: "publishable" | "secret";
  keyPreview: string;
  fullKey: string;
  lastUsedAt: string | null;
  createdAt: string;
  projectName: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [_showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const fetchKeys = () => {
    setLoading(true);
    fetch("/api/v1/keys/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.keys) setKeys(data.keys);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const toggleReveal = (keyId: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) {
        next.delete(keyId);
      } else {
        next.add(keyId);
      }
      return next;
    });
  };

  const copyToClipboard = async (key: ApiKey) => {
    await navigator.clipboard.writeText(key.fullKey);
    setCopiedKey(key.id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">API Keys</h1>
          <p className="text-zinc-400 text-sm">
            Manage your project's API keys for authentication.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium text-sm hover:bg-zinc-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Key
        </button>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-amber-200 font-medium">Keep your secret keys safe</p>
          <p className="text-xs text-amber-400/80 mt-1">
            Secret keys grant full access to your project. Never share them or commit them to
            version control.
          </p>
        </div>
      </div>

      {/* Keys List */}
      <div className="space-y-4">
        {/* Publishable Keys Section */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Key className="w-3 h-3" />
            Publishable Keys
          </h2>
          <div className="space-y-2">
            {keys
              .filter((k) => k.type === "publishable")
              .map((key) => (
                <KeyRow
                  key={key.id}
                  apiKey={key}
                  isRevealed={revealedKeys.has(key.id)}
                  isCopied={copiedKey === key.id}
                  onToggleReveal={() => toggleReveal(key.id)}
                  onCopy={() => copyToClipboard(key)}
                />
              ))}
            {keys.filter((k) => k.type === "publishable").length === 0 && !loading && (
              <div className="text-center py-8 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-xl">
                No publishable keys yet. Create one to get started.
              </div>
            )}
          </div>
        </div>

        {/* Secret Keys Section */}
        <div className="mt-8">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Key className="w-3 h-3" />
            Secret Keys
          </h2>
          <div className="space-y-2">
            {keys
              .filter((k) => k.type === "secret")
              .map((key) => (
                <KeyRow
                  key={key.id}
                  apiKey={key}
                  isRevealed={revealedKeys.has(key.id)}
                  isCopied={copiedKey === key.id}
                  onToggleReveal={() => toggleReveal(key.id)}
                  onCopy={() => copyToClipboard(key)}
                />
              ))}
            {keys.filter((k) => k.type === "secret").length === 0 && !loading && (
              <div className="text-center py-8 text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-xl">
                No secret keys yet. Create one for backend authentication.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-zinc-900 rounded-xl animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}

function KeyRow({
  apiKey,
  isRevealed,
  isCopied,
  onToggleReveal,
  onCopy,
}: {
  apiKey: ApiKey;
  isRevealed: boolean;
  isCopied: boolean;
  onToggleReveal: () => void;
  onCopy: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl group hover:bg-zinc-900/60 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-2 rounded-lg ${apiKey.type === "secret" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"}`}
        >
          <Key className="w-4 h-4" />
        </div>
        <div>
          <div className="font-medium text-zinc-200 text-sm">{apiKey.name}</div>
          <div className="font-mono text-xs text-zinc-500 mt-1">
            {isRevealed ? apiKey.fullKey : apiKey.keyPreview}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-600 mr-4">
          {apiKey.lastUsedAt
            ? `Last used ${new Date(apiKey.lastUsedAt).toLocaleDateString()}`
            : "Never used"}
        </span>
        <button
          onClick={onToggleReveal}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          title={isRevealed ? "Hide" : "Reveal"}
        >
          {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button
          onClick={onCopy}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          title="Copy"
        >
          {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
        <button
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          title="Revoke"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
