import React, { useState } from "react";
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
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          Phase 1 — Development Foundation Active
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          Welcome to <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">NEXORA</span>
        </h1>
        <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
          AI-Powered Student Productivity & Career Intelligence Platform. The application skeleton, modular monolith REST pipeline, and foundation components are successfully initialized.
        </p>
      </div>

      {/* Health Verification Card */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Backend API Health Verification</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Target endpoint: <code className="text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">/api/v1/health</code>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={handleTestHealth} isLoading={isTestingHealth}>
              Test API Connection
            </Button>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
              View Specs
            </Button>
          </div>
        </div>

        {testError && <ErrorMessage title="Connection Test Failed" message={testError} onRetry={handleTestHealth} />}

        {isTestingHealth && <Loader text="Testing backend REST API connection..." size="sm" />}

        {healthResult && !isTestingHealth && (
          <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Status Code 200 OK</span>
              <span className="text-emerald-400">JSON Verified</span>
            </div>
            <pre className="bg-slate-950 p-3 rounded border border-emerald-900/60 font-mono text-xs text-emerald-400 overflow-x-auto">
              {JSON.stringify(healthResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Foundational Stack Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold mb-2">
            FE
          </div>
          <h4 className="text-sm font-semibold text-slate-200">React + Vite Frontend</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tailwind CSS, React Router, and foundational component library (Button, Input, Modal, Loader, ErrorMessage).
          </p>
        </div>

        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 font-bold mb-2">
            BE
          </div>
          <h4 className="text-sm font-semibold text-slate-200">Node.js + Express Backend</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Modular monolith with versioned route handlers (<code className="text-indigo-300">/api/v1</code>), CORS scoping, and global error handling.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold mb-2">
            DB
          </div>
          <h4 className="text-sm font-semibold text-slate-200">MongoDB + Mongoose</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Database connection configuration via Mongoose and environment variable scoping (<code className="text-emerald-300">MONGODB_URI</code>).
          </p>
        </div>
      </div>

      {/* Specifications Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Phase 1 Architecture Specifications"
        footer={<Button variant="secondary" onClick={() => setIsModalOpen(false)}>Close</Button>}
      >
        <div className="space-y-3 text-xs text-slate-300">
          <p><strong className="text-slate-100">Modular Monolith Architecture:</strong> React ↔ REST / JSON ↔ Express ↔ MongoDB.</p>
          <p><strong className="text-slate-100">API Endpoint Rules:</strong> Versioned at <code className="text-indigo-400">/api/v1</code>.</p>
          <p><strong className="text-slate-100">Development Strategy:</strong> End-to-end vertical slices. Non-AI product built before AI integration.</p>
          <p><strong className="text-slate-100">Scope Boundary:</strong> Authentication, Tasks, Study, Career, Analytics, and AI chat are intentionally deferred to Phase 2+.</p>
        </div>
      </Modal>
    </div>
  );
};

export default Home;
