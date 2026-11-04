import React, { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { BarChart3, Table, Download, Check } from "lucide-react";

const PALETTE = [
  "#4F7CFF", // Electric Blue
  "#12B76A", // Emerald
  "#7C6CFA", // Violet
  "#F79009", // Amber
  "#F04438", // Rose
  "#06AED4", // Cyan
  "#EC4899"  // Pink
];

/**
 * Robust JSON parser that handles markdown fences, JS comments, and trailing commas from LLM outputs
 */
function safeParseJson(raw) {
  if (!raw) return null;
  if (typeof raw !== "string") return raw;
  let clean = raw.trim();

  // Strip markdown code fences if present
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
  }

  // Strip single-line comments // ...
  clean = clean.replace(/\/\/.*$/gm, "");

  // Strip multi-line comments /* ... */
  clean = clean.replace(/\/\*[\s\S]*?\*\//g, "");

  // Strip trailing commas before closing braces/brackets
  clean = clean.replace(/,(\s*[}\]])/g, "$1");

  return JSON.parse(clean);
}

export const InteractiveChart = ({ spec }) => {
  const [showTable, setShowTable] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);

  let chartData = null;
  try {
    chartData = safeParseJson(spec);
  } catch {
    return (
      <div className="my-3 p-4 rounded-2xl bg-violet-50/40 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 text-xs text-violet-600 dark:text-violet-400 flex items-center gap-2 animate-pulse">
        <BarChart3 size={15} />
        <span>Loading chart visualization...</span>
      </div>
    );
  }

  if (!chartData || !Array.isArray(chartData.data) || chartData.data.length === 0) {
    return null;
  }

  const {
    type = "bar",
    title = "Interactive Data Visualization",
    xAxisKey = Object.keys(chartData.data[0])[0] || "name",
    yAxisLabel,
    data = [],
    series = []
  } = chartData;

  // Determine series if not explicitly provided
  const activeSeries = series.length > 0
    ? series
    : Object.keys(data[0])
        .filter((k) => k !== xAxisKey)
        .map((key, i) => ({
          key,
          name: key,
          color: PALETTE[i % PALETTE.length]
        }));

  const handleDownloadCsv = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(","))
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  const renderChart = () => {
    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    const gridColor = isDark ? "#1F2937" : "#E7EAF0";
    const tickColor = isDark ? "#94A3B8" : "#64748B";

    switch (type.toLowerCase()) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey={xAxisKey} stroke={tickColor} tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
              <YAxis stroke={tickColor} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#111827" : "#FFFFFF",
                  borderColor: isDark ? "#374151" : "#E2E8F0",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: isDark ? "#F8FAFC" : "#0F172A",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              {activeSeries.map((s, idx) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name || s.key}
                  stroke={s.color || PALETTE[idx % PALETTE.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
              <defs>
                {activeSeries.map((s, idx) => {
                  const col = s.color || PALETTE[idx % PALETTE.length];
                  return (
                    <linearGradient key={`grad-${s.key}`} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={col} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={col} stopOpacity={0.0} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey={xAxisKey} stroke={tickColor} tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
              <YAxis stroke={tickColor} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#111827" : "#FFFFFF",
                  borderColor: isDark ? "#374151" : "#E2E8F0",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: isDark ? "#F8FAFC" : "#0F172A"
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              {activeSeries.map((s, idx) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name || s.key}
                  stroke={s.color || PALETTE[idx % PALETTE.length]}
                  fill={`url(#grad-${s.key})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
      case "donut": {
        const isDonut = type.toLowerCase() === "donut";
        const valKey = activeSeries[0]?.key || Object.keys(data[0])[1];
        return (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#111827" : "#FFFFFF",
                  borderColor: isDark ? "#374151" : "#E2E8F0",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: isDark ? "#F8FAFC" : "#0F172A"
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Pie
                data={data}
                dataKey={valKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                innerRadius={isDonut ? 55 : 0}
                outerRadius={85}
                paddingAngle={3}
                label
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      }

      case "bar":
      default:
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey={xAxisKey}
                stroke={tickColor}
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                stroke={tickColor}
                tick={{ fontSize: 11 }}
                label={
                  yAxisLabel
                    ? {
                        value: yAxisLabel,
                        angle: -90,
                        position: "insideLeft",
                        offset: 10,
                        style: { textAnchor: "middle", fontSize: 10, fill: tickColor }
                      }
                    : undefined
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#111827" : "#FFFFFF",
                  borderColor: isDark ? "#374151" : "#E2E8F0",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: isDark ? "#F8FAFC" : "#0F172A"
                }}
                formatter={(val, name) => [
                  typeof val === "number" ? `${val}%` : val,
                  name || "Value"
                ]}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              {activeSeries.map((s, idx) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.name || s.key}
                  fill={s.color || PALETTE[idx % PALETTE.length]}
                  radius={[6, 6, 0, 0]}
                >
                  {data.map((entry, entryIdx) => (
                    <Cell
                      key={`bar-cell-${entryIdx}`}
                      fill={entry.color || s.color || PALETTE[entryIdx % PALETTE.length]}
                    />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="my-4 rounded-2xl bg-white dark:bg-[#111827] border border-[#E7EAF0] dark:border-[#1F2937] p-5 shadow-sm space-y-3 overflow-hidden">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1F4F9] dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BarChart3 size={15} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#172033] dark:text-slate-100 font-display">
              {title}
            </h4>
            {yAxisLabel && (
              <span className="text-[10px] text-[#667085] dark:text-slate-400 font-mono">
                {yAxisLabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowTable(!showTable)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1 cursor-pointer ${
              showTable
                ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/40"
                : "bg-white dark:bg-slate-900 text-[#667085] dark:text-slate-400 border-[#E7EAF0] dark:border-slate-800 hover:text-[#172033] dark:hover:text-white"
            }`}
          >
            <Table size={12} />
            <span>{showTable ? "Hide Data" : "View Data"}</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 text-[#667085] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white border border-[#E7EAF0] dark:border-slate-800 transition-all flex items-center gap-1 cursor-pointer"
            title="Download CSV"
          >
            {copiedCsv ? <Check size={12} className="text-emerald-500" /> : <Download size={12} />}
            <span>{copiedCsv ? "Downloaded" : "CSV"}</span>
          </button>
        </div>
      </div>

      {/* Main Visualization or Table */}
      {showTable ? (
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-slate-900/60 border-b border-[#E7EAF0] dark:border-slate-800 text-[#667085] dark:text-slate-400 font-mono">
                {Object.keys(data[0]).map((h) => (
                  <th key={h} className="p-2.5 font-semibold capitalize">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F4F9] dark:divide-slate-800 text-[#172033] dark:text-slate-200">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40">
                  {Object.keys(data[0]).map((h) => (
                    <td key={h} className="p-2.5 font-mono text-[11px]">
                      {String(row[h])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="w-full pt-2">{renderChart()}</div>
      )}
    </div>
  );
};

export default InteractiveChart;