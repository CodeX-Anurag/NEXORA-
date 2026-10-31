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
      <div className="p-8 rounded-2xl bg-gradient-to-br from-[#1C1A17] via-[#24211D] to-[#191816] border border-[#332F2A] shadow-xl relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0693B]/10 border border-[#E0693B]/25 text-[#E0693B] text-xs font-semibold mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E0693B]"></span>
          Platform Foundation Active
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#FAF7F2] mb-3 font-display">
          Welcome to <span className="text-[#E0693B]">NEXORA</span>
        </h1>
        <p className="text-[#CDC5B6] text-base max-w-2xl leading-relaxed">
          AI-Powered Student Productivity & Career Intelligence Platform. Seamlessly unifying daily academic study velocity, smart task management, and tailored industry career readiness.
        </p>
      </div>

      {/* Health Verification Card */}
      <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[#FAF7F2] font-display">Backend API Health Verification</h3>
            <p className="text-xs text-[#9C9384] mt-1">
              Target endpoint: <code className="text-[#E0693B] bg-[#141312] px-2.5 py-1 rounded-lg border border-[#2D2925] font-mono">/api/v1/health</code>
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
          <div className="p-4 rounded-xl bg-[#2EA366]/10 border border-[#2EA366]/30 text-[#2EA366] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Status Code 200 OK</span>
              <span className="text-[#2EA366] font-mono">JSON Verified</span>
            </div>
            <pre className="bg-[#141312] p-3 rounded-lg border border-[#2EA366]/20 font-mono text-xs text-[#2EA366] overflow-x-auto">
              {JSON.stringify(healthResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Foundational Stack Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] hover:border-[#3D3832] transition-colors space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#E0693B]/10 border border-[#E0693B]/30 flex items-center justify-center text-[#E0693B] font-bold font-display">
            FE
          </div>
          <h4 className="text-sm font-semibold text-[#FAF7F2]">React 19 + Vite Frontend</h4>
          <p className="text-xs text-[#9C9384] leading-relaxed">
            Tailwind CSS, React Router, and tailored warm design system components (Button, Input, Modal, Loader, ErrorMessage).
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] hover:border-[#3D3832] transition-colors space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#D97706]/10 border border-[#D97706]/30 flex items-center justify-center text-[#D97706] font-bold font-display">
            BE
          </div>
          <h4 className="text-sm font-semibold text-[#FAF7F2]">Node.js + Express Backend</h4>
          <p className="text-xs text-[#9C9384] leading-relaxed">
            Modular architecture with versioned REST route handlers (<code className="text-[#D97706]">/api/v1</code>), secure cookies, and rate limiting.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#191816] border border-[#2D2925] hover:border-[#3D3832] transition-colors space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#2EA366]/10 border border-[#2EA366]/30 flex items-center justify-center text-[#2EA366] font-bold font-display">
            DB
          </div>
          <h4 className="text-sm font-semibold text-[#FAF7F2]">MongoDB + Mongoose</h4>
          <p className="text-xs text-[#9C9384] leading-relaxed">
            Robust document schemas, atomic study sessions, skill inventories, and indexed task management collections.
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
        <div className="space-y-3 text-xs text-[#CDC5B6]">
          <p><strong className="text-[#FAF7F2]">Modular Monolith:</strong> React 19 ↔ REST / JSON ↔ Express ↔ MongoDB Mongoose.</p>
          <p><strong className="text-[#FAF7F2]">API Endpoint Rules:</strong> Versioned at <code className="text-[#E0693B]">/api/v1</code>.</p>
          <p><strong className="text-[#FAF7F2]">Security:</strong> Short-lived access JWTs with httpOnly refresh cookies, CSRF defenses, and rate limiting.</p>
          <p><strong className="text-[#FAF7F2]">AI Engine:</strong> Provider-agnostic LLM adapter with bounded chat context and memory persistence.</p>
        </div>
      </Modal>
    </div>
  );
};

export default Home;
