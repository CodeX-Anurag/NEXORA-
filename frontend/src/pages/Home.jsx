import React, { useState } from "react";
import { ArrowRight, Activity, Layers, Server, Database, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import ErrorMessage from "../components/common/ErrorMessage";
import healthService from "../services/health.service";

export const Home = ({ onRefreshHealth }) => {
  const [isTestingHealth, setIsTestingHealth] = useState(false);
  const [healthResult, setHealthResult] = useState(null);
  const [testError, setTestError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTestHealth = async () => {
    setIsTestingHealth(true);
    setTestError(null);
    try {
      const res = await healthService.checkHealth();
      setHealthResult(res);
      if (onRefreshHealth) onRefreshHealth();
    } catch (err) {
      setTestError(err.message || "Failed to reach API server.");
    } finally {
      setIsTestingHealth(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in py-4">
      {/* Header Banner */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#E7EAF0] shadow-[0_1px_3px_rgba(16,24,40,0.04)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#4F7CFF]/8 via-[#7C6CFA]/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#4F7CFF]/20 text-[#4F7CFF] text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F7CFF] animate-pulse"></span>
            Production System Active
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#172033] font-display leading-[1.15]">
            Master engineering skills with <span className="text-[#4F7CFF]">NEXORA</span>
          </h1>

          <p className="text-[#667085] text-sm sm:text-base leading-relaxed">
            AI-Powered Student Productivity & Career Intelligence Platform. Seamlessly unifying daily academic study velocity, smart task management, oral viva defense preparation, and tailored industry career readiness.
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <Link to="/dashboard">
              <Button variant="primary" size="lg" className="shadow-sm shadow-[#4F7CFF]/25">
                <span>Open Workspace</span>
                <ArrowRight size={16} className="ml-1.5" />
              </Button>
            </Link>
            <Link to="/viva">
              <Button variant="secondary" size="lg">
                <span>Try AI Viva Examiner</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Health Verification Card */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#E7EAF0] space-y-4 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-[#4F7CFF]" />
              <h3 className="text-base font-semibold text-[#172033] font-display">
                Backend API Health Verification
              </h3>
            </div>
            <p className="text-xs text-[#667085] mt-1">
              Target endpoint: <code className="text-[#4F7CFF] bg-[#EEF2FF] px-2 py-0.5 rounded-md font-mono text-xs">/api/v1/health</code>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" onClick={handleTestHealth} isLoading={isTestingHealth}>
              Test Connection
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
              View Specs
            </Button>
          </div>
        </div>

        {testError && <ErrorMessage title="Connection Test Failed" message={testError} onRetry={handleTestHealth} />}

        {isTestingHealth && <Loader text="Testing backend REST API connection..." size="sm" />}

        {healthResult && !isTestingHealth && (
          <div className="p-4 rounded-xl bg-[#ECFDF3] border border-[#A6F4C5] text-[#027A48] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={16} />
                Status Code 200 OK — Operational
              </span>
              <span className="font-mono text-[11px] text-[#027A48]">JSON Verified</span>
            </div>
            <pre className="bg-white p-3 rounded-lg border border-[#A6F4C5]/60 font-mono text-xs text-[#027A48] overflow-x-auto">
              {JSON.stringify(healthResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Foundational Stack Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] hover:border-[#4F7CFF]/30 transition-all shadow-[0_1px_3px_rgba(16,24,40,0.04)] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] border border-[#4F7CFF]/20 flex items-center justify-center text-[#4F7CFF]">
            <Layers size={20} />
          </div>
          <h4 className="text-sm font-semibold text-[#172033]">React 19 + Vite Frontend</h4>
          <p className="text-xs text-[#667085] leading-relaxed">
            Tailwind CSS, React Router, modern design tokens, accessible interactive widgets, and seamless dark/light modes.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] hover:border-[#4F7CFF]/30 transition-all shadow-[0_1px_3px_rgba(16,24,40,0.04)] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] border border-[#7C6CFA]/20 flex items-center justify-center text-[#7C6CFA]">
            <Server size={20} />
          </div>
          <h4 className="text-sm font-semibold text-[#172033]">Node.js + Express Backend</h4>
          <p className="text-xs text-[#667085] leading-relaxed">
            Modular architecture with versioned REST route handlers (<code className="text-[#7C6CFA]">/api/v1</code>), secure JWT cookies, and rate limiting.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E7EAF0] hover:border-[#4F7CFF]/30 transition-all shadow-[0_1px_3px_rgba(16,24,40,0.04)] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF3] border border-[#12B76A]/20 flex items-center justify-center text-[#12B76A]">
            <Database size={20} />
          </div>
          <h4 className="text-sm font-semibold text-[#172033]">MongoDB + Mongoose</h4>
          <p className="text-xs text-[#667085] leading-relaxed">
            Document schemas, study velocity session logs, skill gap models, and indexed task management collections.
          </p>
        </div>
      </div>

      {/* Specifications Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="NEXORA Architecture Specifications"
        footer={<Button variant="secondary" onClick={() => setIsModalOpen(false)}>Close</Button>}
      >
        <div className="space-y-3 text-xs text-[#667085]">
          <p><strong className="text-[#172033]">Modular Monolith:</strong> React 19 ↔ REST / JSON ↔ Express ↔ MongoDB Mongoose.</p>
          <p><strong className="text-[#172033]">API Endpoint Rules:</strong> Versioned at <code className="text-[#4F7CFF] bg-[#EEF2FF] px-1.5 py-0.5 rounded font-mono">/api/v1</code>.</p>
          <p><strong className="text-[#172033]">Security:</strong> Short-lived access JWTs with httpOnly refresh cookies, CSRF defenses, and rate limiting.</p>
          <p><strong className="text-[#172033]">AI Engine:</strong> Provider-agnostic LLM adapter with bounded chat context and memory persistence.</p>
        </div>
      </Modal>
    </div>
  );
};

export default Home;
