"use client";

import { motion } from "framer-motion";
import { Ban, Calendar, Mail, Search, Shield, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  avatar: string;
  provider: string;
  mobile: string | null;
  location: { lat: number; lng: number } | null;
  lastSignIn: string | null;
  createdAt: string;
  status: "active" | "banned";
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/v1/users/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Identities (Surveillance View)</h1>
          <p className="text-zinc-400 text-sm">Monitor end-users, locations, and biometric data.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/50 text-zinc-500 font-medium border-b border-zinc-800/50">
              <tr>
                <th className="px-6 py-3 font-medium">User Profile</th>
                <th className="px-6 py-3 font-medium">Surveillance Data</th>
                <th className="px-6 py-3 font-medium">Last Seen</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-10 w-40 bg-zinc-800 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 bg-zinc-800 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 bg-zinc-800 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-16 bg-zinc-800 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 w-8 bg-zinc-800 rounded" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No users found matching "{search}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-zinc-900/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative group/avatar cursor-pointer">
                          <img
                            src={user.avatar}
                            alt="Login Face"
                            className="w-12 h-12 rounded-xl bg-zinc-800 object-cover border-2 border-zinc-800 group-hover/avatar:border-blue-500 transition-colors"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-zinc-950 rounded-full p-0.5">
                            {user.provider === "google" && (
                              <span className="w-4 h-4 block bg-red-500 rounded-full border-2 border-zinc-950" />
                            )}
                            {user.provider === "github" && (
                              <span className="w-4 h-4 block bg-white rounded-full border-2 border-zinc-950" />
                            )}
                            {user.provider === "email" && (
                              <Mail className="w-4 h-4 text-zinc-400 bg-zinc-950" />
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-zinc-200">{user.email}</div>
                          {user.mobile && (
                            <div className="text-xs text-zinc-500 font-mono mt-0.5">
                              {user.mobile}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {user.location ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Live Location
                          </div>
                          <a
                            href={`https://maps.google.com/?q=${user.location.lat},${user.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-zinc-500 hover:text-blue-400 underline decoration-zinc-700 hover:decoration-blue-500/50 underline-offset-2"
                          >
                            {user.location.lat.toFixed(4)}, {user.location.lng.toFixed(4)}
                          </a>
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-600 italic">Location hidden</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {user.lastSignIn ? new Date(user.lastSignIn).toLocaleString() : "Never"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                          user.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                          title="View Details"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-400"
                          title="Ban User"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-500"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-zinc-800/50 text-xs text-zinc-500 flex justify-between items-center bg-zinc-900/30">
          <span>Showing {filteredUsers.length} users</span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 bg-zinc-800 rounded hover:bg-zinc-700 disabled:opacity-50"
              disabled
            >
              Previous
            </button>
            <button
              className="px-3 py-1 bg-zinc-800 rounded hover:bg-zinc-700 disabled:opacity-50"
              disabled
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
