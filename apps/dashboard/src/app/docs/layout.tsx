import { Book, Code, Cpu, Lock, Server, Shield, Terminal } from "lucide-react";
import Link from "next/link";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <div className="fixed top-0 left-0 w-full h-16 border-b border-zinc-900 bg-black/50 backdrop-blur-xl z-50 flex items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl tracking-tighter hover:text-blue-400 transition-colors"
        >
          <Shield className="w-5 h-5 text-blue-500" />
          IzzU Docs
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="w-64 fixed h-[calc(100vh-4rem)] border-r border-zinc-900 overflow-y-auto hidden md:block bg-black">
          <div className="flex flex-col gap-1 p-4">
            <div className="mb-4">
              <h4 className="px-2 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Getting Started
              </h4>
              <NavLink href="/docs#introduction" icon={<Book className="w-4 h-4" />}>
                Introduction
              </NavLink>
              <NavLink href="/docs#architecture" icon={<Cpu className="w-4 h-4" />}>
                Architecture
              </NavLink>
              <NavLink href="/docs#security" icon={<Lock className="w-4 h-4" />}>
                Security Model
              </NavLink>
            </div>
            <div className="mb-4">
              <h4 className="px-2 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Integration
              </h4>
              <NavLink href="/docs#quick-start" icon={<Terminal className="w-4 h-4" />}>
                Quick Start
              </NavLink>
              <NavLink href="/docs#sdk" icon={<Code className="w-4 h-4" />}>
                Web SDK
              </NavLink>
              <NavLink href="/docs#deployment" icon={<Server className="w-4 h-4" />}>
                Deployment
              </NavLink>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 p-8 max-w-4xl mx-auto">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  children,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 rounded-lg hover:text-white hover:bg-zinc-900 transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
