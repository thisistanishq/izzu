"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Code2,
  Command,
  Key,
  LayoutGrid,
  LogOut,
  Search,
  Settings,
  ShieldAlert,
  Users,
  Webhook,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [_isMobileMenuOpen, _setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutGrid },
    { label: "Identities", href: "/dashboard/users", icon: Users },
    { label: "Integration", href: "/dashboard/integration", icon: Code2 },
    { label: "API Keys", href: "/dashboard/keys", icon: Key },
    { label: "Audit Logs", href: "/dashboard/logs", icon: ShieldAlert },
    { label: "Webhooks", href: "/dashboard/webhooks", icon: Webhook },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800/50 bg-zinc-900/20 backdrop-blur-xl">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
              I
            </div>
            <span className="font-bold text-lg tracking-tight">IzzU</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700 ml-2">
              BETA
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Platform
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? "text-white bg-zinc-800/80"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
                }`}
              >
                <item.icon
                  className={`w-4 h-4 transition-colors ${isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"}`}
                />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-5 bg-blue-500 rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-zinc-800/50">
          <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-zinc-800/30 transition-colors text-left group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border border-zinc-700 shadow-inner" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Tanishq S.</p>
              <p className="text-xs text-zinc-500 truncate group-hover:text-zinc-400">
                tanishq@izzu.com
              </p>
            </div>
            <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
          </button>
          <div className="mt-2 text-[10px] text-center text-zinc-600">v1.0.0 (Production)</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-black relative">
        {/* Background ambient glow */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-blue-900/10 blur-[120px] pointer-events-none" />

        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800/50 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span className="hover:text-white cursor-pointer transition-colors">tanishq-org</span>
            <span className="text-zinc-700">/</span>
            <span className="text-white font-medium">
              {navItems.find((i) => i.href === pathname)?.label || "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-500 text-xs hover:border-zinc-700 transition-colors cursor-pointer">
              <Search className="w-3 h-3" />
              <span>Search...</span>
              <div className="flex items-center gap-0.5 ml-2">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </div>

            <button className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full ring-2 ring-black" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 relative z-10 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
