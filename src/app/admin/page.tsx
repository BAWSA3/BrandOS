"use client";

import { useState, useEffect, useCallback, Fragment, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, Power, Eye, EyeOff, Plus, RefreshCw, Check, X } from "lucide-react";

interface InviteCode {
  id: string;
  code: string;
  createdBy: string;
  maxUses: number;
  usedCount: number;
  usedBy: string[];
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

interface Stats {
  totalCodes: number;
  activeCodes: number;
  totalRedemptions: number;
  codesCreatedToday: number;
}

// Loading fallback for Suspense
function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="flex items-center gap-3 text-white/50">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}

// Main export wrapped in Suspense
export default function AdminPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminPageContent />
    </Suspense>
  );
}

function AdminPageContent() {
  const searchParams = useSearchParams();
  const adminKey = searchParams.get("key");

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate form state
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generateUsername, setGenerateUsername] = useState("");
  const [generateCount, setGenerateCount] = useState(3);
  const [generateMaxUses, setGenerateMaxUses] = useState(3);
  const [generateExpiry, setGenerateExpiry] = useState("");
  const [generating, setGenerating] = useState(false);

  // Expanded rows for viewing redeemers
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Copy feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!adminKey) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/invites", {
        headers: {
          Authorization: `Bearer ${adminKey}`,
        },
      });

      if (response.status === 401) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      setIsAuthorized(true);
      setStats(data.stats);
      setCodes(data.codes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateUsername.trim()) return;

    setGenerating(true);
    try {
      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify({
          username: generateUsername.trim(),
          count: generateCount,
          maxUses: generateMaxUses,
          expiresAt: generateExpiry || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate codes");
      }

      // Refresh data
      await fetchData();
      setShowGenerateForm(false);
      setGenerateUsername("");
      setGenerateCount(3);
      setGenerateMaxUses(3);
      setGenerateExpiry("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate codes");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleActive = async (code: InviteCode) => {
    try {
      const response = await fetch("/api/admin/invites", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify({
          id: code.id,
          isActive: !code.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update code");
      }

      // Update local state
      setCodes((prev) =>
        prev.map((c) =>
          c.id === code.id ? { ...c, isActive: !c.isActive } : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update code");
    }
  };

  const handleCopyLink = async (code: string) => {
    const link = `${window.location.origin}/invite/${code}`;
    await navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleRowExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Unauthorized view
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Unauthorized</h1>
          <p className="text-white/50">
            Please provide a valid admin key in the URL.
          </p>
          <p className="text-white/30 text-sm mt-2">
            Example: /admin?key=YOUR_ADMIN_KEY
          </p>
        </div>
      </div>
    );
  }

  // Loading view
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/50">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Invite Code Management</h1>
            <p className="text-white/50 text-sm mt-1">
              Manage Inner Circle invite codes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowGenerateForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0047FF] hover:bg-[#0047FF]/80 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Generate Codes
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Codes" value={stats.totalCodes} />
            <StatCard label="Active Codes" value={stats.activeCodes} trend="up" />
            <StatCard label="Total Redemptions" value={stats.totalRedemptions} />
            <StatCard label="Created Today" value={stats.codesCreatedToday} />
          </div>
        )}

        {/* Generate Form Modal */}
        {showGenerateForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#14141F] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">Generate Invite Codes</h2>
              <form onSubmit={handleGenerateCodes}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-2">
                      Username (who the codes are for)
                    </label>
                    <input
                      type="text"
                      value={generateUsername}
                      onChange={(e) => setGenerateUsername(e.target.value)}
                      placeholder="@username"
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#0047FF] focus:outline-none transition-colors"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/50 mb-2">
                        Number of codes (1-10)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={generateCount}
                        onChange={(e) => setGenerateCount(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#0047FF] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/50 mb-2">
                        Max uses per code
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={generateMaxUses}
                        onChange={(e) => setGenerateMaxUses(parseInt(e.target.value) || 3)}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#0047FF] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-2">
                      Expiry date (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={generateExpiry}
                      onChange={(e) => setGenerateExpiry(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-[#0047FF] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowGenerateForm(false)}
                    className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating || !generateUsername.trim()}
                    className="px-4 py-2 rounded-lg bg-[#0047FF] hover:bg-[#0047FF]/80 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? "Generating..." : "Generate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Codes Table */}
        <div className="bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-mono uppercase tracking-wider text-white/50 px-4 py-3">
                    Code
                  </th>
                  <th className="text-left text-xs font-mono uppercase tracking-wider text-white/50 px-4 py-3">
                    Creator
                  </th>
                  <th className="text-left text-xs font-mono uppercase tracking-wider text-white/50 px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-mono uppercase tracking-wider text-white/50 px-4 py-3">
                    Used
                  </th>
                  <th className="text-left text-xs font-mono uppercase tracking-wider text-white/50 px-4 py-3">
                    Created
                  </th>
                  <th className="text-left text-xs font-mono uppercase tracking-wider text-white/50 px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <Fragment key={code.id}>
                    <tr
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-[#0047FF]">{code.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white/70">{code.createdBy}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                            code.isActive && code.usedCount < code.maxUses
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              code.isActive && code.usedCount < code.maxUses
                                ? "bg-green-400"
                                : "bg-red-400"
                            }`}
                          />
                          {code.isActive && code.usedCount < code.maxUses
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white/70">
                          {code.usedCount} / {code.maxUses}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white/50 text-sm">
                          {formatDate(code.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyLink(code.code)}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors group"
                            title="Copy invite link"
                          >
                            {copiedCode === code.code ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-white/50 group-hover:text-white" />
                            )}
                          </button>
                          <button
                            onClick={() => handleToggleActive(code)}
                            className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors group ${
                              code.isActive ? "text-green-400" : "text-red-400"
                            }`}
                            title={code.isActive ? "Deactivate" : "Activate"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          {code.usedBy.length > 0 && (
                            <button
                              onClick={() => toggleRowExpanded(code.id)}
                              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors group"
                              title="View redeemers"
                            >
                              {expandedRows.has(code.id) ? (
                                <EyeOff className="w-4 h-4 text-white/50 group-hover:text-white" />
                              ) : (
                                <Eye className="w-4 h-4 text-white/50 group-hover:text-white" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded row for redeemers */}
                    {expandedRows.has(code.id) && code.usedBy.length > 0 && (
                      <tr className="bg-white/[0.02]">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="text-sm">
                            <span className="text-white/50">Redeemed by: </span>
                            <span className="text-white/70">
                              {code.usedBy.join(", ")}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {codes.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-white/50"
                    >
                      No invite codes found. Generate some to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: number;
  trend?: "up" | "down" | "neutral";
}) {
  const trendColors = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-white",
  };

  return (
    <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-2xl p-4">
      <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/50">
        {label}
      </span>
      <div className="mt-2">
        <span
          className={`text-3xl font-light ${trend ? trendColors[trend] : "text-white"}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
