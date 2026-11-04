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
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

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

  // Controlled polling interval
  useEffect(() => {
    isMountedRef.current = true;
    fetchDiagnostics(false);

    let timer = null;
    if (pollIntervalSec > 0) {
      timer = setInterval(() => {
        fetchDiagnostics(true);
      }, pollIntervalSec * 1000);
    }

    return () => {
      isMountedRef.current = false;
      if (timer) clearInterval(timer);
    };
  }, [fetchDiagnostics, pollIntervalSec]);

  if (isLoading && !diagnostics) {
    return <Loader text="Synthesizing operational telemetry diagnostics..." />;
  }

  // Format uptime seconds into human-readable string
  const formatUptime = (seconds) => {
    if (!seconds && seconds !== 0) return "N/A";
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d}d ` : ""}${h}h ${m}m ${s}s`;
  };

  const sys = diagnostics?.system || {};
  const db = diagnostics?.database || {};
  const reqs = diagnostics?.requests || {};
  const lat = diagnostics?.latency || {};
  const ai = diagnostics?.aiTelemetry || {};
  const bg = diagnostics?.backgroundJobs || {};

  // Status Distribution Chart Data
  const statusChartData = [
    { name: "2xx Success", count: reqs.statusDistribution?.["2xx"] || 0, color: "#10B981" },
    { name: "4xx Client Err", count: reqs.statusDistribution?.["4xx"] || 0, color: "#F59E0B" },
    { name: "5xx Server Err", count: reqs.statusDistribution?.["5xx"] || 0, color: "#EF4444" }
  ];

  // Latency Percentiles Chart Data
  const latencyChartData = [
    { metric: "Average", ms: lat.avgMs || 0 },
    { metric: "P95 Latency", ms: lat.p95Ms || 0 },
    { metric: "P99 Latency", ms: lat.p99Ms || 0 }
  ];

  // Memory Usage Chart Data with modern primary/secondary palette
  const memoryChartData = [
    { name: "Heap Used", mb: sys.memoryUsage?.heapUsedMB || 0, fill: "#4F7CFF" },
    { name: "Heap Total", mb: sys.memoryUsage?.heapTotalMB || 0, fill: "#7C6CFA" },
    { name: "RSS Memory", mb: sys.memoryUsage?.rssMB || 0, fill: "#94A3B8" }
  ];

  const tooltipStyle = {
    backgroundColor: "#FFFFFF",
    borderColor: "#E7EAF0",
    borderRadius: "12px",
    color: "#172033",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04)"
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header & Polling Toolbar */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111827] border border-blue-200/60 dark:border-blue-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 font-display">Engineering Console</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Live Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#172033] dark:text-slate-100 font-display">System Observability &amp; Telemetry</h1>
          <p className="text-xs text-[#667085] dark:text-slate-400 max-w-2xl leading-relaxed">
            Real-time diagnostics tracking API latency percentiles, error rates, AI usage costs, quality metrics, and background jobs.
          </p>
        </div>

        {/* Polling & Refresh Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-[#F7F8FC] dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-[#E7EAF0] dark:border-slate-800">
            <span className="text-[11px] text-[#667085] dark:text-slate-400 font-medium">Auto Refresh:</span>
            <select
              value={pollIntervalSec}
              onChange={(e) => setPollIntervalSec(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-[#172033] dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value={5} className="bg-white dark:bg-slate-900">5 seconds</option>
              <option value={10} className="bg-white dark:bg-slate-900">10 seconds</option>
              <option value={30} className="bg-white dark:bg-slate-900">30 seconds</option>
              <option value={0} className="bg-white dark:bg-slate-900">Off</option>
            </select>
          </div>

          <button
            onClick={() => fetchDiagnostics(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
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
        <div className="text-right text-[11px] text-[#667085] font-mono">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {error && <ErrorMessage title="Observability Telemetry Error" message={error} onRetry={() => fetchDiagnostics(false)} />}

      {/* SECTION 1: SYSTEM OVERVIEW KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white border border-[#E7EAF0] shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider font-display">API Liveness</span>
          <p className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 200 OK
          </p>
          <p className="text-[10px] text-[#667085]">Node {sys.nodeVersion || "v20"}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E7EAF0] shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider font-display">Database Readiness</span>
          <p className="text-lg font-bold text-emerald-600 capitalize">{db.status || "connected"}</p>
          <p className="text-[10px] text-[#667085]">ReadyState {db.readyState ?? 1}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E7EAF0] shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider font-display">Process Uptime</span>
          <p className="text-sm font-extrabold text-[#4F7CFF] font-mono">{formatUptime(sys.uptimeSeconds)}</p>
          <p className="text-[10px] text-[#667085]">Active server process</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E7EAF0] shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider font-display">Total Requests</span>
          <p className="text-xl font-bold text-[#172033] font-mono">{reqs.total || 0}</p>
          <p className="text-[10px] text-[#667085]">In-memory tracking</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E7EAF0] shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider font-display">HTTP Error Rate</span>
          <p className={`text-xl font-bold font-mono ${(reqs.errorRatePercent || 0) > 5 ? "text-rose-500" : "text-emerald-600"}`}>
            {reqs.errorRatePercent || 0}%
          </p>
          <p className="text-[10px] text-[#667085]">4xx + 5xx percentage</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E7EAF0] shadow-xs space-y-1">
          <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider font-display">Average Latency</span>
          <p className="text-xl font-bold text-amber-600 font-mono">{lat.avgMs || 0} ms</p>
          <p className="text-[10px] text-[#667085]">500-sample reservoir</p>
        </div>
      </div>

      {/* SECTION 2: REQUEST PERFORMANCE & LATENCY CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#172033] font-display">HTTP Status Distribution</h3>
              <p className="text-xs text-[#667085]">Classified response statuses (2xx, 4xx, 5xx)</p>
            </div>
            <span className="text-xs font-mono font-semibold text-[#667085]">Total: {reqs.total || 0}</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency Percentiles Bar Chart */}
        <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] space-y-4 shadow-xs">
          <div>
            <h3 className="text-base font-semibold text-[#172033] font-display">Latency Percentiles (ms)</h3>
            <p className="text-xs text-[#667085]">Average, P95, and P99 exact reservoir calculations</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7EAF0" />
                <XAxis dataKey="metric" stroke="#667085" fontSize={11} />
                <YAxis stroke="#667085" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="ms" fill="#4F7CFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 3: AI COST & QUALITY INTELLIGENCE */}
      <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E7EAF0] pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F7CFF] font-display">AI Telemetry</span>
            <h3 className="text-lg font-bold text-[#172033] font-display">AI Cost, Token & Quality Intelligence</h3>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#4F7CFF] border border-blue-200">
            {ai.totalRequests || 0} AI Operations
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0] space-y-1">
            <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider font-display">Total AI Tokens</span>
            <p className="text-2xl font-extrabold text-[#4F7CFF] font-mono">{(ai.totalTokens || 0).toLocaleString()}</p>
            <p className="text-[10px] text-[#667085]">Prompt + Completion</p>
          </div>

          <div className="p-4 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0] space-y-1">
            <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider font-display">Estimated USD Cost</span>
            <p className="text-2xl font-extrabold text-emerald-600 font-mono">${(ai.totalEstimatedCostUSD || 0).toFixed(4)}</p>
            <p className="text-[10px] text-[#667085]">Model pricing</p>
          </div>

          <div className="p-4 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0] space-y-1">
            <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider font-display">Avg Quality Score</span>
            <p className="text-2xl font-extrabold text-amber-600 font-mono">{ai.avgQualityScore ?? 100}/100</p>
            <p className="text-[10px] text-[#667085]">Deterministic scoring</p>
          </div>

          <div className="p-4 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0] space-y-1">
            <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider font-display">Quality Success Rate</span>
            <p className="text-2xl font-extrabold text-[#172033] font-mono">{ai.qualitySuccessRatePercent ?? 100}%</p>
            <p className="text-[10px] text-[#667085]">Schema compliance</p>
          </div>
        </div>

        {/* Diagnostic Counts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0] flex items-center justify-between">
            <span className="text-xs text-[#667085]">Schema Validation Failures:</span>
            <span className="text-sm font-bold font-mono text-amber-600">{ai.schemaValidationFailures || 0}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0] flex items-center justify-between">
            <span className="text-xs text-[#667085]">Fallback Activations:</span>
            <span className="text-sm font-bold font-mono text-[#4F7CFF]">{ai.fallbackCount || 0}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0] flex items-center justify-between">
            <span className="text-xs text-[#667085]">Average AI Latency:</span>
            <span className="text-sm font-bold font-mono text-[#172033]">{ai.avgLatencyMs || 0} ms</span>
          </div>
        </div>
      </div>

      {/* SECTION 4: BACKGROUND JOBS & MEMORY FOOTPRINT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Background Jobs & Scheduler Health */}
        <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F7CFF] font-display">Scheduler</span>
              <h3 className="text-base font-semibold text-[#172033] font-display">Background Job Health</h3>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${bg.isRunning ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}>
              {bg.isRunning ? "Scheduler Active" : "Stopped"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0]">
              <span className="text-[10px] text-[#667085] uppercase font-display">Total Job Runs</span>
              <p className="text-xl font-bold font-mono text-[#172033]">{bg.metrics?.totalJobRuns || 0}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0]">
              <span className="text-[10px] text-[#667085] uppercase font-display">Successful Runs</span>
              <p className="text-xl font-bold font-mono text-emerald-600">{bg.metrics?.successfulRuns || 0}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0]">
              <span className="text-[10px] text-[#667085] uppercase font-display">Notifications Created</span>
              <p className="text-xl font-bold font-mono text-[#4F7CFF]">{bg.metrics?.notificationsCreated || 0}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F7F8FC] border border-[#E7EAF0]">
              <span className="text-[10px] text-[#667085] uppercase font-display">Duplicates Skipped</span>
              <p className="text-xl font-bold font-mono text-amber-600">{bg.metrics?.duplicatesSkipped || 0}</p>
            </div>
          </div>
        </div>

        {/* Node Process Memory Footprint */}
        <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] space-y-4 shadow-xs">
          <div>
            <h3 className="text-base font-semibold text-[#172033] font-display">Node Process Memory Footprint (MB)</h3>
            <p className="text-xs text-[#667085]">RSS, Heap Total, and Heap Used RAM breakdown</p>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memoryChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E7EAF0" />
                <XAxis type="number" stroke="#667085" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#667085" fontSize={11} width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="mb" fill="#4F7CFF" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObservabilityDashboard;
