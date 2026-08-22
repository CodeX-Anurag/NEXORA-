import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useAuth } from "../context/AuthContext";
import diagnosticsService from "../services/diagnostics.service";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";

export const ObservabilityDashboard = () => {
  const { accessToken } = useAuth();

  const [diagnostics, setDiagnostics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [pollIntervalSec, setPollIntervalSec] = useState(10); // Default 10s
  const [lastUpdated, setLastUpdated] = useState(null);

  const isMountedRef = useRef(true);

  const fetchDiagnostics = useCallback(
    async (isBackground = false) => {
      if (!accessToken) return;

      if (!isBackground) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError("");

      try {
        const data = await diagnosticsService.getDiagnostics(accessToken);
        if (isMountedRef.current) {
          setDiagnostics(data);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err.message || "Failed to fetch operational diagnostics telemetry.");
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [accessToken]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchDiagnostics(false);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDiagnostics]);

  // Periodic Controlled Polling Timer with Unmount Cleanup
  useEffect(() => {
    if (pollIntervalSec <= 0) return;

    const timer = setInterval(() => {
      fetchDiagnostics(true);
    }, pollIntervalSec * 1000);

    return () => {
      clearInterval(timer);
    };
  }, [pollIntervalSec, fetchDiagnostics]);

  if (isLoading) {
    return <Loader text="Loading production telemetry diagnostics..." />;
  }

  // Format Helper: Seconds to HH:MM:SS
  const formatUptime = (totalSeconds = 0) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const sys = diagnostics?.system || {};
  const db = diagnostics?.database || {};
  const reqs = diagnostics?.requests || {};
  const lat = diagnostics?.latency || {};
  const ai = diagnostics?.aiTelemetry || {};
  const bg = diagnostics?.backgroundJobs || {};

  // Status Distribution Chart Data
  const statusChartData = [
    { name: "2xx Success", count: reqs.statusDistribution?.["2xx"] || 0, color: "#10b981" },
    { name: "4xx Client Err", count: reqs.statusDistribution?.["4xx"] || 0, color: "#f59e0b" },
    { name: "5xx Server Err", count: reqs.statusDistribution?.["5xx"] || 0, color: "#ef4444" }
  ];

  // Latency Percentiles Chart Data
  const latencyChartData = [
    { metric: "Average", ms: lat.avgMs || 0 },
    { metric: "P95 Latency", ms: lat.p95Ms || 0 },
    { metric: "P99 Latency", ms: lat.p99Ms || 0 }
  ];

  // Memory Usage Chart Data
  const memoryChartData = [
    { name: "Heap Used", mb: sys.memoryUsage?.heapUsedMB || 0, fill: "#6366f1" },
    { name: "Heap Total", mb: sys.memoryUsage?.heapTotalMB || 0, fill: "#38bdf8" },
    { name: "RSS Memory", mb: sys.memoryUsage?.rssMB || 0, fill: "#94a3b8" }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header & Polling Toolbar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Engineering Console</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              Live Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">System Observability & Telemetry</h1>
          <p className="text-xs text-slate-400">
            Real-time diagnostics tracking API latency percentiles, error rates, AI usage costs, quality metrics, and background jobs.
          </p>
        </div>

        {/* Polling & Refresh Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Auto Refresh:</span>
            <select
              value={pollIntervalSec}
              onChange={(e) => setPollIntervalSec(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value={5} className="bg-slate-900">5 seconds</option>
              <option value={10} className="bg-slate-900">10 seconds</option>
              <option value={30} className="bg-slate-900">30 seconds</option>
              <option value={0} className="bg-slate-900">Off</option>
            </select>
          </div>

          <button
            onClick={() => fetchDiagnostics(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div className="text-right text-[11px] text-slate-500 font-mono">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {error && <ErrorMessage title="Observability Telemetry Error" message={error} onRetry={() => fetchDiagnostics(false)} />}

      {/* SECTION 1: SYSTEM OVERVIEW KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">API Liveness</span>
          <p className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 200 OK
          </p>
          <p className="text-[10px] text-slate-500">Node {sys.nodeVersion || "v20"}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Database Readiness</span>
          <p className="text-lg font-bold text-emerald-400 capitalize">{db.status || "connected"}</p>
          <p className="text-[10px] text-slate-500">ReadyState {db.readyState ?? 1}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Process Uptime</span>
          <p className="text-sm font-extrabold text-indigo-300 font-mono">{formatUptime(sys.uptimeSeconds)}</p>
          <p className="text-[10px] text-slate-500">Active server process</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Requests</span>
          <p className="text-xl font-bold text-slate-100 font-mono">{reqs.total || 0}</p>
          <p className="text-[10px] text-slate-500">In-memory tracking</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">HTTP Error Rate</span>
          <p className={`text-xl font-bold font-mono ${(reqs.errorRatePercent || 0) > 5 ? "text-rose-400" : "text-emerald-400"}`}>
            {reqs.errorRatePercent || 0}%
          </p>
          <p className="text-[10px] text-slate-500">4xx + 5xx percentage</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Average Latency</span>
          <p className="text-xl font-bold text-sky-400 font-mono">{lat.avgMs || 0} ms</p>
          <p className="text-[10px] text-slate-500">500-sample reservoir</p>
        </div>
      </div>

      {/* SECTION 2: REQUEST PERFORMANCE & LATENCY CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-100">HTTP Status Distribution</h3>
              <p className="text-xs text-slate-400">Classified response statuses (2xx, 4xx, 5xx)</p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-300">Total: {reqs.total || 0}</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency Percentiles Bar Chart */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Latency Percentiles (ms)</h3>
            <p className="text-xs text-slate-400">Average, P95, and P99 exact reservoir calculations</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="metric" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff" }} />
                <Bar dataKey="ms" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 3: AI COST & QUALITY INTELLIGENCE (11A & 11D METRICS) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Phase 11A & 11D AI Telemetry</span>
            <h3 className="text-lg font-bold text-slate-100">AI Cost, Token & Quality Intelligence</h3>
          </div>
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {ai.totalRequests || 0} AI Operations
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total AI Tokens</span>
            <p className="text-2xl font-extrabold text-indigo-400 font-mono">{(ai.totalTokens || 0).toLocaleString()}</p>
            <p className="text-[10px] text-slate-500">Prompt + Completion</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Estimated USD Cost</span>
            <p className="text-2xl font-extrabold text-emerald-400 font-mono">${(ai.totalEstimatedCostUSD || 0).toFixed(4)}</p>
            <p className="text-[10px] text-slate-500">Model pricing model</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Quality Score</span>
            <p className="text-2xl font-extrabold text-purple-400 font-mono">{ai.avgQualityScore ?? 100}/100</p>
            <p className="text-[10px] text-slate-500">Deterministic scoring</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Quality Success Rate</span>
            <p className="text-2xl font-extrabold text-sky-400 font-mono">{ai.qualitySuccessRatePercent ?? 100}%</p>
            <p className="text-[10px] text-slate-500">Schema compliance</p>
          </div>
        </div>

        {/* Diagnostic Counts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Schema Validation Failures:</span>
            <span className="text-sm font-bold font-mono text-amber-400">{ai.schemaValidationFailures || 0}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Fallback Activations:</span>
            <span className="text-sm font-bold font-mono text-indigo-400">{ai.fallbackCount || 0}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Average AI Latency:</span>
            <span className="text-sm font-bold font-mono text-cyan-400">{ai.avgLatencyMs || 0} ms</span>
          </div>
        </div>
      </div>

      {/* SECTION 4: BACKGROUND JOBS & MEMORY FOOTPRINT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Background Jobs & Scheduler Health (11C Metrics) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Phase 11C Scheduler</span>
              <h3 className="text-base font-semibold text-slate-100">Background Job Health</h3>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${bg.isRunning ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
              {bg.isRunning ? "Scheduler Active" : "Stopped"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Total Job Runs</span>
              <p className="text-xl font-bold font-mono text-slate-100">{bg.metrics?.totalJobRuns || 0}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Successful Runs</span>
              <p className="text-xl font-bold font-mono text-emerald-400">{bg.metrics?.successfulRuns || 0}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Notifications Created</span>
              <p className="text-xl font-bold font-mono text-indigo-400">{bg.metrics?.notificationsCreated || 0}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Duplicates Skipped</span>
              <p className="text-xl font-bold font-mono text-amber-400">{bg.metrics?.duplicatesSkipped || 0}</p>
            </div>
          </div>
        </div>

        {/* Node Process Memory Footprint */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Node Process Memory Footprint (MB)</h3>
            <p className="text-xs text-slate-400">RSS, Heap Total, and Heap Used RAM breakdown</p>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memoryChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", color: "#fff" }} />
                <Bar dataKey="mb" fill="#818cf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObservabilityDashboard;
