"use client";

import { motion } from "framer-motion";
import { Camera, Check, ChevronDown, Copy, Key, MapPin, Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
  slug: string;
  apiKeyPrefix: string;
  createdAt: string;
  usersCount: number;
}

interface Stats {
  totalUsers: number;
  activeFaceIds: number;
  locationsTracked: number;
  totalProjects: number;
}

export default function DashboardOverview() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [_loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectSlug, setNewProjectSlug] = useState("");
  const [createdKeys, setCreatedKeys] = useState<{
    apiKey: string;
    secretKey: string;
  } | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeFaceIds: 0,
    locationsTracked: 0,
    totalProjects: 0,
  });

  useEffect(() => {
    // Fetch projects
    fetch("/api/v1/projects/list")
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json();
        if (data.projects) {
          setProjects(data.projects);
          if (data.projects.length > 0) {
            setSelectedProject(data.projects[0]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Fetch real-time stats
    fetch("/api/v1/analytics/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
      })
      .catch(console.error);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleCreateProject = async () => {
    if (!newProjectName || !newProjectSlug) return;

    const res = await fetch("/api/v1/projects/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newProjectName, slug: newProjectSlug }),
    });
    const data = await res.json();

    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (res.ok) {
      setCreatedKeys({
        apiKey: data.project.apiKey,
        secretKey: data.project.secretKey,
      });
      // Refresh projects list
      const listRes = await fetch("/api/v1/projects/list");
      const listData = await listRes.json();
      setProjects(listData.projects || []);
    } else {
      alert(`Error: ${data.error}`);
    }
  };

  const sdkInstallCode = `npm install @izzu/stack @izzu/stack-ui`;
  const sdkUsageCode = `import { IzzUProvider, FaceAuth } from "@izzu/stack-ui";

function App() {
  return (
    <IzzUProvider 
      projectId="${selectedProject?.id || "YOUR_PROJECT_ID"}"
      apiKey="${selectedProject?.apiKeyPrefix || "izzu_pk_live_..."}"
    >
      {/* End-User Login: Face ID + Location (Mandatory) */}
      <FaceAuth 
        mode="login"
        requireLocation={true}
        onSuccess={(user) => console.log("Logged in:", user)}
        onFaceCapture={(photoUrl) => console.log("Photo:", photoUrl)}
      />
    </IzzUProvider>
  );
}`;

  return (
    <div className="space-y-8">
      {/* Header Section with Project Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 mb-2">
            Dashboard
          </h1>
          <p className="text-zinc-400">Manage your projects and monitor end-user activity.</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Project Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg text-sm hover:bg-zinc-800 transition-colors min-w-[200px] justify-between"
            >
              <span className="truncate">{selectedProject?.name || "Select Project"}</span>
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            </button>
            {showProjectDropdown && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project);
                      setShowProjectDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors ${selectedProject?.id === project.id ? "bg-zinc-800" : ""}`}
                  >
                    <div className="font-medium text-zinc-200">{project.name}</div>
                    <div className="text-xs text-zinc-500">{project.slug}</div>
                  </button>
                ))}
                <div className="border-t border-zinc-800">
                  <button
                    onClick={() => {
                      setShowCreateModal(true);
                      setShowProjectDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 text-blue-400 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Create New Project
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-semibold hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      </div>

      {/* SDK Integration Section */}
      {selectedProject && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-2xl p-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                🔐 Integrate Face ID into Your App
              </h2>
              <p className="text-zinc-400 text-sm">
                Copy this code to add mandatory Face ID + Location tracking to your project.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-xs border border-emerald-500/20">
                <Camera className="w-3 h-3" /> Face ID Required
              </div>
              <div className="flex items-center gap-2 bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-full text-xs border border-amber-500/20">
                <MapPin className="w-3 h-3" /> Location Tracked
              </div>
            </div>
          </div>

          {/* Install Command */}
          <div className="mb-4">
            <div className="text-xs text-zinc-500 uppercase font-medium mb-2">1. Install SDK</div>
            <div className="bg-black rounded-lg border border-zinc-800 p-4 font-mono text-sm text-zinc-300 flex items-center justify-between">
              <span>$ {sdkInstallCode}</span>
              <button
                onClick={() => copyToClipboard(sdkInstallCode, "install")}
                className="text-zinc-500 hover:text-white"
              >
                {copied === "install" ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Usage Code */}
          <div className="mb-4">
            <div className="text-xs text-zinc-500 uppercase font-medium mb-2">
              2. Implement Face Auth
            </div>
            <div className="bg-black rounded-lg border border-zinc-800 p-4 font-mono text-sm text-zinc-300 overflow-x-auto relative">
              <button
                onClick={() => copyToClipboard(sdkUsageCode, "usage")}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white bg-zinc-900/80 p-1.5 rounded"
              >
                {copied === "usage" ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <pre className="text-xs">{sdkUsageCode}</pre>
            </div>
          </div>

          {/* API Keys */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-zinc-500 uppercase font-medium mb-2">Project ID</div>
              <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-3 font-mono text-xs text-zinc-300 flex items-center justify-between">
                <span className="truncate">{selectedProject.id}</span>
                <Copy
                  className="w-3 h-3 text-zinc-600 cursor-pointer hover:text-white"
                  onClick={() => copyToClipboard(selectedProject.id, "pid")}
                />
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 uppercase font-medium mb-2">
                API Key (Publishable)
              </div>
              <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-3 font-mono text-xs text-zinc-300 flex items-center justify-between">
                <span className="truncate">{selectedProject.apiKeyPrefix}</span>
                <Key className="w-3 h-3 text-zinc-600" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid - REAL DATA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total End-Users", value: stats.totalUsers, icon: Users },
          {
            label: "Active Face IDs",
            value: stats.activeFaceIds,
            icon: Camera,
          },
          {
            label: "Locations Tracked",
            value: stats.locationsTracked,
            icon: MapPin,
          },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-2xl hover:bg-zinc-900/60 transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-zinc-800/50 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full border border-zinc-700/50">
                Live
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left">
              {stat.value.toLocaleString()}
            </div>
            <div className="text-sm text-zinc-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-md"
          >
            {!createdKeys ? (
              <>
                <h2 className="text-xl font-bold mb-6">Create New Project</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-zinc-500 uppercase font-medium mb-2">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white"
                      placeholder="My Secure App"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 uppercase font-medium mb-2">
                      Project Slug
                    </label>
                    <input
                      type="text"
                      value={newProjectSlug}
                      onChange={(e) =>
                        setNewProjectSlug(e.target.value.toLowerCase().replace(/\s/g, "-"))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white"
                      placeholder="my-secure-app"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 bg-zinc-800 rounded-lg hover:bg-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProject}
                    className="flex-1 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 font-semibold"
                  >
                    Create
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h2 className="text-xl font-bold">Project Created!</h2>
                  <p className="text-zinc-400 text-sm mt-2">
                    Save these keys! The secret key won't be shown again.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-medium">API Key</label>
                    <div className="mt-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-300 break-all">
                      {createdKeys.apiKey}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-medium">
                      Secret Key (Save Now!)
                    </label>
                    <div className="mt-1 bg-red-950/50 border border-red-500/30 rounded-lg p-3 font-mono text-xs text-red-300 break-all">
                      {createdKeys.secretKey}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatedKeys(null);
                  }}
                  className="w-full mt-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200"
                >
                  Done
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
