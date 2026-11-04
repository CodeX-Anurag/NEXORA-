/**
 * NEXORA Multi-Color Design System
 * Defines consistent, recognizable accent colors across modules, subjects, priorities, and tech stacks.
 */

// 1. Module Themes for Sidebar & Global Navigation
export const MODULE_THEMES = {
  "/dashboard": {
    name: "Dashboard",
    color: "#3B82F6",
    activeText: "text-blue-600 dark:text-blue-400",
    activeBg: "bg-blue-50/80 dark:bg-blue-950/40",
    activeBorder: "border-blue-500",
    barColor: "bg-blue-500",
    iconColor: "text-blue-600 dark:text-blue-400",
    glow: "shadow-blue-500/20"
  },
  "/tasks": {
    name: "Tasks",
    color: "#F59E0B",
    activeText: "text-amber-600 dark:text-amber-400",
    activeBg: "bg-amber-50/80 dark:bg-amber-950/40",
    activeBorder: "border-amber-500",
    barColor: "bg-amber-500",
    iconColor: "text-amber-600 dark:text-amber-400",
    glow: "shadow-amber-500/20"
  },
  "/study": {
    name: "Study Tracker",
    color: "#8B5CF6",
    activeText: "text-violet-600 dark:text-violet-400",
    activeBg: "bg-violet-50/80 dark:bg-violet-950/40",
    activeBorder: "border-violet-500",
    barColor: "bg-violet-500",
    iconColor: "text-violet-600 dark:text-violet-400",
    glow: "shadow-violet-500/20"
  },
  "/career": {
    name: "Career Intelligence",
    color: "#10B981",
    activeText: "text-emerald-600 dark:text-emerald-400",
    activeBg: "bg-emerald-50/80 dark:bg-emerald-950/40",
    activeBorder: "border-emerald-500",
    barColor: "bg-emerald-500",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    glow: "shadow-emerald-500/20"
  },
  "/projects": {
    name: "Projects Portfolio",
    color: "#06B6D4",
    activeText: "text-cyan-600 dark:text-cyan-400",
    activeBg: "bg-cyan-50/80 dark:bg-cyan-950/40",
    activeBorder: "border-cyan-500",
    barColor: "bg-cyan-500",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    glow: "shadow-cyan-500/20"
  },
  "/resume": {
    name: "Resume & Portfolio",
    color: "#F43F5E",
    activeText: "text-rose-600 dark:text-rose-400",
    activeBg: "bg-rose-50/80 dark:bg-rose-950/40",
    activeBorder: "border-rose-500",
    barColor: "bg-rose-500",
    iconColor: "text-rose-600 dark:text-rose-400",
    glow: "shadow-rose-500/20"
  },
  "/analytics": {
    name: "Analytics",
    color: "#6366F1",
    activeText: "text-indigo-600 dark:text-indigo-400",
    activeBg: "bg-indigo-50/80 dark:bg-indigo-950/40",
    activeBorder: "border-indigo-500",
    barColor: "bg-indigo-500",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    glow: "shadow-indigo-500/20"
  },
  "/ai-coach": {
    name: "AI Coach",
    color: "#A855F7",
    activeText: "text-purple-600 dark:text-purple-400",
    activeBg: "bg-purple-50/80 dark:bg-purple-950/40",
    activeBorder: "border-purple-500",
    barColor: "bg-purple-500",
    iconColor: "text-purple-600 dark:text-purple-400",
    glow: "shadow-purple-500/20"
  },
  "/viva": {
    name: "AI Socratic Viva",
    color: "#EC4899",
    activeText: "text-pink-600 dark:text-pink-400",
    activeBg: "bg-pink-50/80 dark:bg-pink-950/40",
    activeBorder: "border-pink-500",
    barColor: "bg-pink-500",
    iconColor: "text-pink-600 dark:text-pink-400",
    glow: "shadow-pink-500/20"
  },
  "/memory-settings": {
    name: "Memory & Privacy",
    color: "#14B8A6",
    activeText: "text-teal-600 dark:text-teal-400",
    activeBg: "bg-teal-50/80 dark:bg-teal-950/40",
    activeBorder: "border-teal-500",
    barColor: "bg-teal-500",
    iconColor: "text-teal-600 dark:text-teal-400",
    glow: "shadow-teal-500/20"
  },
  "/observability": {
    name: "System Observability",
    color: "#64748B",
    activeText: "text-slate-700 dark:text-slate-300",
    activeBg: "bg-slate-100 dark:bg-slate-800/60",
    activeBorder: "border-slate-500",
    barColor: "bg-slate-500",
    iconColor: "text-slate-600 dark:text-slate-400",
    glow: "shadow-slate-500/20"
  }
};

// 2. Deterministic Subject Themes for Study Tracker & Subject Comparison
export const SUBJECT_PALETTE = [
  {
    hex: "#8B5CF6",
    name: "Violet",
    bg: "bg-violet-500",
    lightBg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800/40",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500"
  },
  {
    hex: "#10B981",
    name: "Emerald",
    bg: "bg-emerald-500",
    lightBg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800/40",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500"
  },
  {
    hex: "#06B6D4",
    name: "Cyan",
    bg: "bg-cyan-500",
    lightBg: "bg-cyan-50 dark:bg-cyan-950/40",
    border: "border-cyan-200 dark:border-cyan-800/40",
    text: "text-cyan-700 dark:text-cyan-300",
    dot: "bg-cyan-500"
  },
  {
    hex: "#F59E0B",
    name: "Amber",
    bg: "bg-amber-500",
    lightBg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800/40",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500"
  },
  {
    hex: "#3B82F6",
    name: "Electric Blue",
    bg: "bg-blue-500",
    lightBg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800/40",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500"
  },
  {
    hex: "#F43F5E",
    name: "Rose",
    bg: "bg-rose-500",
    lightBg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800/40",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500"
  },
  {
    hex: "#EC4899",
    name: "Pink",
    bg: "bg-pink-500",
    lightBg: "bg-pink-50 dark:bg-pink-950/40",
    border: "border-pink-200 dark:border-pink-800/40",
    text: "text-pink-700 dark:text-pink-300",
    dot: "bg-pink-500"
  },
  {
    hex: "#14B8A6",
    name: "Teal",
    bg: "bg-teal-500",
    lightBg: "bg-teal-50 dark:bg-teal-950/40",
    border: "border-teal-200 dark:border-teal-800/40",
    text: "text-teal-700 dark:text-teal-300",
    dot: "bg-teal-500"
  }
];

export const getSubjectTheme = (rawSubject = "") => {
  const norm = String(rawSubject).trim().toLowerCase();

  // Core specified mappings
  if (norm.includes("dsa") || norm.includes("data struct") || norm.includes("algo") || norm.includes("leetcode")) {
    return SUBJECT_PALETTE[0]; // Violet (#8B5CF6)
  }
  if (norm.includes("dbms") || norm.includes("database") || norm.includes("sql") || norm.includes("mongo") || norm.includes("postgres")) {
    return SUBJECT_PALETTE[1]; // Emerald (#10B981)
  }
  if (norm.includes("web") || norm.includes("frontend") || norm.includes("react") || norm.includes("javascript") || norm.includes("html") || norm.includes("fullstack")) {
    return SUBJECT_PALETTE[2]; // Cyan (#06B6D4)
  }
  if (norm.includes("math") || norm.includes("calculus") || norm.includes("discrete") || norm.includes("linear algebra") || norm.includes("stat")) {
    return SUBJECT_PALETTE[3]; // Amber (#F59E0B)
  }
  if (norm.includes("os") || norm.includes("operat") || norm.includes("network") || norm.includes("system") || norm.includes("architect")) {
    return SUBJECT_PALETTE[4]; // Electric Blue (#3B82F6)
  }

  // Stable deterministic hash fallback for any custom subject
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = (hash << 5) - hash + norm.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SUBJECT_PALETTE.length;
  return SUBJECT_PALETTE[index];
};

// 3. Priority Themes for Tasks
export const PRIORITY_THEMES = {
  urgent: {
    label: "Urgent",
    badge: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40",
    dot: "bg-rose-500 animate-pulse",
    color: "#EF4444"
  },
  high: {
    label: "High",
    badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
    dot: "bg-amber-500",
    color: "#F59E0B"
  },
  medium: {
    label: "Medium",
    badge: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
    dot: "bg-blue-500",
    color: "#3B82F6"
  },
  low: {
    label: "Low",
    badge: "bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
    color: "#64748B"
  }
};

// 4. Technology Stack Tags Color System for Projects & Resumes
export const getTechStackTheme = (tech = "") => {
  const norm = String(tech).trim().toLowerCase();

  // Frontend / UI
  if (["react", "next.js", "nextjs", "vue", "angular", "svelte", "tailwind", "css", "html", "vite"].includes(norm)) {
    return {
      bg: "bg-cyan-50 dark:bg-cyan-950/40",
      text: "text-cyan-700 dark:text-cyan-300",
      border: "border-cyan-200 dark:border-cyan-800/40"
    };
  }

  // Backend / Languages
  if (["node", "nodejs", "express", "python", "fastapi", "django", "java", "spring", "golang", "go", "rust", "c++"].includes(norm)) {
    return {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-200 dark:border-emerald-800/40"
    };
  }

  // Databases & Cloud
  if (["mongodb", "postgresql", "postgres", "mysql", "redis", "firebase", "supabase", "docker", "kubernetes", "aws", "gcp"].includes(norm)) {
    return {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-200 dark:border-amber-800/40"
    };
  }

  // AI / ML / Data
  if (["tensorflow", "pytorch", "openai", "gemini", "langchain", "machine learning", "ai", "pandas", "numpy"].includes(norm)) {
    return {
      bg: "bg-violet-50 dark:bg-violet-950/40",
      text: "text-violet-700 dark:text-violet-300",
      border: "border-violet-200 dark:border-violet-800/40"
    };
  }

  // Fallback
  return {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800/40"
  };
};
