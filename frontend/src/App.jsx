import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
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
import Viva from "./pages/Viva";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/common/ErrorBoundary";
import StartupSplash from "./components/common/StartupSplash";
import healthService from "./services/health.service";

export const App = () => {
  const [apiStatus, setApiStatus] = useState("checking");
  const [showSplash, setShowSplash] = useState(true);

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
    // Auto-poll health status every 10 seconds so status dynamically updates
    const interval = setInterval(verifyHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          {showSplash && <StartupSplash onFinish={() => setShowSplash(false)} />}
          <PageLayout apiStatus={apiStatus} onRefreshHealth={verifyHealth}>
            <ErrorBoundary>
              <Routes>
              <Route path="/" element={<Home onRefreshHealth={verifyHealth} />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
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
              <Route path="/memories" element={<Navigate to="/memory-settings" replace />} />
              <Route
                path="/resume"
                element={
                  <ProtectedRoute>
                    <ResumeBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/viva"
                element={
                  <ProtectedRoute>
                    <Viva />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </PageLayout>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
  );
};

export default App;
