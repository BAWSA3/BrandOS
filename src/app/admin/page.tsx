"use client";

import { useState, useEffect, useCallback, Fragment, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Copy,
  Power,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Check,
  X,
  MessageSquare,
  Users,
  Bug,
  Lightbulb,
  Star,
  ChevronDown,
  Trash2,
} from "lucide-react";

// ===== TYPES =====

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

interface InviteStats {
  totalCodes: number;
  activeCodes: number;
  totalRedemptions: number;
  codesCreatedToday: number;
}

interface FeedbackItem {
  id: string;
  userId: string | null;
  userName: string | null;
  userHandle: string | null;
  type: string;
  category: string | null;
  message: string;
  rating: number | null;
  url: string | null;
  status: string;
  priority: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackStats {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
  bugs: number;
  ideas: number;
  avgRating: number | null;
  npsScore: number | null;
}

type TabType = "invites" | "feedback";

// ===== LOADING FALLBACK =====

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

// ===== MAIN EXPORT =====

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
  const [activeTab, setActiveTab] = useState<TabType>("invites");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite state
  const [inviteStats, setInviteStats] = useState<InviteStats | null>(null);
  const [codes, setCodes] = useState<InviteCode[]>([]);

  // Feedback state
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState<string>("all");

  // Generate form state
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generateUsername, setGenerateUsername] = useState("");
  const [generateCount, setGenerateCount] = useState(3);
  const [generateMaxUses, setGenerateMaxUses] = useState(3);
  const [generateExpiry, setGenerateExpiry] = useState("");
  const [generating, setGenerating] = useState(false);

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedFeedback, setExpandedFeedback] = useState<Set<string>>(new Set());

  // Copy feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // ===== FETCH FUNCTIONS =====

  const fetchInvites = useCallback(async () => {
    if (!adminKey) return;

    try {
      const response = await fetch("/api/admin/invites", {
        headers: { Authorization: `Bearer ${adminKey}` },
      });

      if (response.status === 401) {
        setIsAuthorized(false);
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch invites");

      const data = await response.json();
      setIsAuthorized(true);
      setInviteStats(data.stats);
      setCodes(data.codes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, [adminKey]);

  const fetchFeedback = useCallback(async () => {
    if (!adminKey) return;

    try {
      const params = new URLSearchParams();
      if (feedbackFilter !== "all") {
        if (["new", "reviewed", "in_progress", "resolved"].includes(feedbackFilter)) {
          params.set("status", feedbackFilter);
        } else {
          params.set("type", feedbackFilter);
        }
      }

      const response = await fetch(`/api/admin/feedback?${params}`, {
        headers: { Authorization: `Bearer ${adminKey}` },
      });

      if (response.status === 401) {
        setIsAuthorized(false);
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch feedback");

      const data = await response.json();
      setIsAuthorized(true);
      setFeedbackStats(data.stats);
      setFeedback(data.feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, [adminKey, feedbackFilter]);

  const fetchData = useCallback(async () => {
    if (!adminKey) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    await Promise.all([fetchInvites(), fetchFeedback()]);

    setLoading(false);
  }, [adminKey, fetchInvites, fetchFeedback]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "feedback" && adminKey) {
      fetchFeedback();
    }
  }, [feedbackFilter, activeTab, adminKey, fetchFeedback]);

  // ===== INVITE HANDLERS =====

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

      if (!response.ok) throw new Error("Failed to generate codes");

      await fetchInvites();
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
        body: JSON.stringify({ id: code.id, isActive: !code.isActive }),
      });

      if (!response.ok) throw new Error("Failed to update code");

      setCodes((prev) =>
        prev.map((c) => (c.id === code.id ? { ...c, isActive: !c.isActive } : c))
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ===== FEEDBACK HANDLERS =====

  const handleUpdateFeedback = async (
    id: string,
    updates: { status?: string; priority?: string; adminNotes?: string }
  ) => {
    try {
      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) throw new Error("Failed to update feedback");

      const data = await response.json();
      setFeedback((prev) =>
        prev.map((f) => (f.id === id ? data.feedback : f))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update feedback");
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;

    try {
      const response = await fetch(`/api/admin/feedback?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminKey}` },
      });

      if (!response.ok) throw new Error("Failed to delete feedback");

      setFeedback((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete feedback");
    }
  };

  const toggleFeedbackExpanded = (id: string) => {
    setExpandedFeedback((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ===== HELPERS =====

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <Bug className="w-4 h-4 text-red-400" />;
      case "idea":
        return <Lightbulb className="w-4 h-4 text-yellow-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "reviewed":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "in_progress":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "resolved":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "wont_fix":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      default:
        return "bg-white/10 text-white/60 border-white/20";
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "low":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      default:
        return "";
    }
  };

  // ===== UNAUTHORIZED VIEW =====

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Unauthorized</h1>
          <p className="text-white/50">Please provide a valid admin key in the URL.</p>
          <p className="text-white/30 text-sm mt-2">Example: /admin?key=YOUR_ADMIN_KEY</p>
        </div>
      </div>
    );
  }

  // ===== LOADING VIEW =====

  if (loading) {
    return <AdminLoading />;
  }

  // ===== MAIN VIEW =====

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-white/50 text-sm mt-1">
              Manage invite codes and user feedback
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
            {activeTab === "invites" && (
              <button
                onClick={() => setShowGenerateForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0047FF] hover:bg-[#0047FF]/80 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Generate Codes
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("invites")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "invites"
                ? "bg-white/10 text-white border border-white/20"
                : "bg-white/5 text-white/60 border border-transparent hover:bg-white/10"
            }`}
          >
            <Users className="w-4 h-4" />
            Invite Codes
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === "feedback"
                ? "bg-white/10 text-white border border-white/20"
                : "bg-white/5 text-white/60 border border-transparent hover:bg-white/10"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Feedback
            {feedbackStats && feedbackStats.new > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                {feedbackStats.new}
              </span>
            )}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {/* ===== INVITES TAB ===== */}
        {activeTab === "invites" && (
          <>
            {/* Stats Cards */}
            {inviteStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Codes" value={inviteStats.totalCodes} />
                <StatCard label="Active Codes" value={inviteStats.activeCodes} trend="up" />
                <StatCard label="Total Redemptions" value={inviteStats.totalRedemptions} />
                <StatCard label="Created Today" value={inviteStats.codesCreatedToday} />
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
                        <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
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
                        {expandedRows.has(code.id) && code.usedBy.length > 0 && (
                          <tr className="bg-white/[0.02]">
                            <td colSpan={6} className="px-4 py-3">
                              <div className="text-sm">
                                <span className="text-white/50">Redeemed by: </span>
                                <span className="text-white/70">{code.usedBy.join(", ")}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                    {codes.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-white/50">
                          No invite codes found. Generate some to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ===== FEEDBACK TAB ===== */}
        {activeTab === "feedback" && (
          <>
            {/* Stats Cards */}
            {feedbackStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                <StatCard label="Total" value={feedbackStats.total} />
                <StatCard label="New" value={feedbackStats.new} trend={feedbackStats.new > 0 ? "up" : undefined} />
                <StatCard label="In Progress" value={feedbackStats.inProgress} />
                <StatCard label="Resolved" value={feedbackStats.resolved} trend="up" />
                <StatCard label="Bugs" value={feedbackStats.bugs} icon={<Bug className="w-4 h-4 text-red-400" />} />
                <StatCard label="Ideas" value={feedbackStats.ideas} icon={<Lightbulb className="w-4 h-4 text-yellow-400" />} />
              </div>
            )}

            {/* Additional Stats Row */}
            {feedbackStats && (
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-2xl p-4">
                  <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/50 flex items-center gap-2">
                    <Star className="w-3 h-3" /> Avg Rating
                  </span>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-3xl font-light text-white">
                      {feedbackStats.avgRating !== null ? feedbackStats.avgRating.toFixed(1) : "—"}
                    </span>
                    {feedbackStats.avgRating !== null && (
                      <span className="text-white/50">/ 5</span>
                    )}
                  </div>
                </div>
                <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-2xl p-4">
                  <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/50">
                    NPS Score
                  </span>
                  <div className="mt-2">
                    <span
                      className={`text-3xl font-light ${
                        feedbackStats.npsScore !== null
                          ? feedbackStats.npsScore >= 50
                            ? "text-green-400"
                            : feedbackStats.npsScore >= 0
                            ? "text-yellow-400"
                            : "text-red-400"
                          : "text-white"
                      }`}
                    >
                      {feedbackStats.npsScore !== null ? feedbackStats.npsScore : "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { value: "all", label: "All" },
                { value: "new", label: "New" },
                { value: "in_progress", label: "In Progress" },
                { value: "resolved", label: "Resolved" },
                { value: "bug", label: "Bugs" },
                { value: "idea", label: "Ideas" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFeedbackFilter(filter.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    feedbackFilter === filter.value
                      ? "bg-white/20 text-white border border-white/30"
                      : "bg-white/5 text-white/60 border border-transparent hover:bg-white/10"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Feedback List */}
            <div className="space-y-4">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className="bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-xl overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className="flex items-start gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleFeedbackExpanded(item.id)}
                  >
                    <div className="flex-shrink-0 mt-1">{getTypeIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(item.status)}`}>
                          {item.status.replace("_", " ")}
                        </span>
                        {item.priority && (
                          <span className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                        )}
                        {item.rating && (
                          <span className="flex items-center gap-1 text-yellow-400 text-xs">
                            <Star className="w-3 h-3 fill-current" />
                            {item.rating}/5
                          </span>
                        )}
                      </div>
                      <p className="text-white/80 text-sm line-clamp-2">{item.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                        <span>{item.userHandle ? `@${item.userHandle}` : "Anonymous"}</span>
                        <span>{formatDate(item.createdAt)}</span>
                        {item.url && <span className="truncate max-w-[200px]">{item.url}</span>}
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-white/30 transition-transform ${
                        expandedFeedback.has(item.id) ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Expanded Content */}
                  {expandedFeedback.has(item.id) && (
                    <div className="border-t border-white/10 p-4 bg-white/[0.02]">
                      {/* Full Message */}
                      <div className="mb-4">
                        <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                          Full Message
                        </label>
                        <p className="text-white/80 text-sm whitespace-pre-wrap">{item.message}</p>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Status */}
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                            Status
                          </label>
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateFeedback(item.id, { status: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#0047FF] focus:outline-none"
                          >
                            <option value="new">New</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="wont_fix">Won&apos;t Fix</option>
                          </select>
                        </div>

                        {/* Priority */}
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                            Priority
                          </label>
                          <select
                            value={item.priority || ""}
                            onChange={(e) =>
                              handleUpdateFeedback(item.id, {
                                priority: e.target.value || undefined,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#0047FF] focus:outline-none"
                          >
                            <option value="">No Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>

                        {/* Delete */}
                        <div className="flex items-end">
                          <button
                            onClick={() => handleDeleteFeedback(item.id)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Admin Notes */}
                      <div className="mt-4">
                        <label className="block text-xs uppercase tracking-wider text-white/50 mb-2">
                          Admin Notes
                        </label>
                        <textarea
                          value={item.adminNotes || ""}
                          onChange={(e) =>
                            handleUpdateFeedback(item.id, { adminNotes: e.target.value })
                          }
                          placeholder="Add internal notes..."
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:border-[#0047FF] focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {feedback.length === 0 && (
                <div className="text-center py-12 text-white/50">
                  No feedback found matching your filters.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ===== STAT CARD COMPONENT =====

function StatCard({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: number;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}) {
  const trendColors = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-white",
  };

  return (
    <div className="bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-2xl p-4">
      <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/50 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <div className="mt-2">
        <span className={`text-3xl font-light ${trend ? trendColors[trend] : "text-white"}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
