import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "./Button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[NEXORA Error Boundary Caught Error]:", error);
    if (errorInfo?.componentStack) {
      console.error("[NEXORA Component Stack]:", errorInfo.componentStack);
    }
    this.setState({ errorInfo });
  }

  componentDidUpdate(prevProps) {
    // Automatically recover and reset error state when user navigates between modules / routes
    if (this.state.hasError && prevProps.locationKey !== this.props.locationKey) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-[#191816] border border-[#2D2925] text-center space-y-6 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono uppercase font-bold tracking-wider">
              Application Recovery
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#FAF7F2] font-display">
              Something went wrong in this module
            </h2>
            <p className="text-xs sm:text-sm text-[#9C9384] max-w-md mx-auto leading-relaxed">
              An unexpected client runtime error occurred while rendering this view. You can retry or safely return to the dashboard.
            </p>
          </div>

          {/* Development-only error inspection drawer */}
          {import.meta.env.DEV && this.state.error && (
            <div className="text-left bg-[#141312] p-4 rounded-xl border border-rose-900/40 text-xs font-mono text-rose-300 space-y-2 overflow-x-auto max-h-60">
              <p className="font-bold text-rose-400 text-[11px] uppercase tracking-wider">
                [Dev Diagnostics — Visible Only in Development]
              </p>
              <p className="font-semibold">{this.state.error.toString()}</p>
              {this.state.error.stack && (
                <pre className="text-[10px] text-[#A89F91] whitespace-pre-wrap leading-tight mt-1">
                  {this.state.error.stack}
                </pre>
              )}
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[10px] text-[#787165] whitespace-pre-wrap leading-tight mt-2 border-t border-[#262420] pt-1">
                  Component Stack:{this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button variant="primary" size="sm" onClick={this.handleReset} className="flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Try Again
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5"
            >
              Reload Page
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                this.handleReset();
                if (this.props.onNavigateDashboard) {
                  this.props.onNavigateDashboard();
                } else {
                  window.location.href = "/dashboard";
                }
              }}
              className="flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" /> Go to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = (props) => {
  let locationKey = props.locationKey || "root";
  let navigate = null;
  try {
    const location = useLocation();
    locationKey = location.pathname;
    navigate = useNavigate();
  } catch {
    // Outside router context (e.g. tests)
  }

  const handleNavigateDashboard = () => {
    if (navigate) {
      navigate("/dashboard");
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <ErrorBoundaryClass
      locationKey={locationKey}
      onNavigateDashboard={handleNavigateDashboard}
      {...props}
    />
  );
};

export default ErrorBoundary;
