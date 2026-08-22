import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PageLayout from "./components/layout/PageLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminRoute from "./components/common/AdminRoute";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Study from "./pages/Study";
import Career from "./pages/Career";
import Projects from "./pages/Projects";
import Analytics from "./pages/Analytics";
import AIChat from "./pages/AIChat";
import MemorySettings from "./pages/MemorySettings";
import ObservabilityDashboard from "./pages/ObservabilityDashboard";
import ResumeBuilder from "./pages/ResumeBuilder";
import Login from "./pages/Login";
import Register from "./pages/Register";
import healthService from "./services/health.service";

export const App = () => {
  const [apiStatus, setApiStatus] = useState("checking");

  const verifyHealth = async () => {
    setApiStatus("checking");
    try {
      const data = await healthService.checkHealth();
      if (data && data.success) {
        setApiStatus("healthy");
      } else {
        setApiStatus("offline");
      }
    } catch {
      setApiStatus("offline");
    }
  };

  useEffect(() => {
    verifyHealth();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <PageLayout apiStatus={apiStatus}>
          <Routes>
            <Route path="/" element={<Home onRefreshHealth={verifyHealth} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/study"
              element={
                <ProtectedRoute>
                  <Study />
                </ProtectedRoute>
              }
            />
            <Route
              path="/career"
              element={
                <ProtectedRoute>
                  <Career />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-coach"
              element={
                <ProtectedRoute>
                  <AIChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/memory-settings"
              element={
                <ProtectedRoute>
                  <MemorySettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/memories"
              element={
                <ProtectedRoute>
                  <MemorySettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume"
              element={
                <ProtectedRoute>
                  <ResumeBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/observability"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <ObservabilityDashboard />
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
          </Routes>
        </PageLayout>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
