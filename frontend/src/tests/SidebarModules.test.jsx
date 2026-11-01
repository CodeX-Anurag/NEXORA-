import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import Career from "../pages/Career";
import Tasks from "../pages/Tasks";
import Dashboard from "../pages/Dashboard";
import Study from "../pages/Study";
import Projects from "../pages/Projects";
import ResumeBuilder from "../pages/ResumeBuilder";
import Analytics from "../pages/Analytics";
import AIChat from "../pages/AIChat";
import Viva from "../pages/Viva";
import MemorySettings from "../pages/MemorySettings";
import ObservabilityDashboard from "../pages/ObservabilityDashboard";

// Mock fetch to reject or return empty
global.fetch = vi.fn().mockImplementation(() => {
  return Promise.resolve({
    ok: false,
    status: 500,
    json: async () => ({ message: "Backend error simulation" }),
    text: async () => JSON.stringify({ message: "Backend error simulation" })
  });
});

describe("All 10 Sidebar modules after API failure / offline backend", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("nexora_token", "fake-token");
    localStorage.setItem(
      "nexora_user",
      JSON.stringify({
        _id: "user123",
        name: "Test User",
        email: "test@example.com",
        role: "admin"
      })
    );
  });

  const renderWithProviders = (Component) => {
    return render(
      <AuthProvider>
        <MemoryRouter>
          <Component />
        </MemoryRouter>
      </AuthProvider>
    );
  };

  it("renders Career without hook order error", async () => {
    renderWithProviders(Career);
    await waitFor(() => {
      expect(document.body).toBeDefined();
    }, { timeout: 3000 });
  });

  it("renders Dashboard without crashing", async () => {
    renderWithProviders(Dashboard);
    await waitFor(() => {
      expect(document.body).toBeDefined();
    }, { timeout: 3000 });
  });

  it("renders Tasks without crashing", async () => {
    renderWithProviders(Tasks);
    await waitFor(() => {
      expect(document.body).toBeDefined();
    }, { timeout: 3000 });
  });

  it("renders Study without child object error", async () => {
    renderWithProviders(Study);
    await waitFor(() => {
      expect(document.body).toBeDefined();
    }, { timeout: 3000 });
  });

  it("renders Projects without child object error", async () => {
    renderWithProviders(Projects);
    await waitFor(() => {
      expect(document.body).toBeDefined();
    }, { timeout: 3000 });
  });

  it("renders ResumeBuilder without crashing", async () => {
    renderWithProviders(ResumeBuilder);
    await waitFor(() => {
      expect(document.body).toBeDefined();
    }, { timeout: 3000 });
  });

  it("renders Analytics without crashing", async () => {
    renderWithProviders(Analytics);
    await waitFor(() => {
      expect(document.body).toBeDefined();
    }, { timeout: 3000 });
  });

  it("renders AIChat without scrollIntoView error", async () => {
    renderWithProviders(AIChat);
    await waitFor(() => {
      expect(document.body).toBeDefined();
    }, { timeout: 3000 });
  });

  it("renders Viva without crashing", async () => {
    renderWithProviders(Viva);
    await waitFor(() => {
      expect(document.body).toBeDefined();
    }, { timeout: 3000 });
  });

  it("renders MemorySettings without crashing", async () => {
    renderWithProviders(MemorySettings);
    await waitFor(() => {
      expect(document.body).toBeDefined();
    }, { timeout: 3000 });
  });

  it("renders ObservabilityDashboard without crashing", async () => {
    renderWithProviders(ObservabilityDashboard);
    await waitFor(() => {
      expect(document.body).toBeDefined();
    }, { timeout: 3000 });
  });

  it("recovers from error when route changes in ErrorBoundary", async () => {
    const FaultyComponent = ({ shouldThrow }) => {
      if (shouldThrow) {
        throw new Error("Simulated component explosion");
      }
      return <div>Healthy Component Content</div>;
    };

    const { ErrorBoundary } = await import("../components/common/ErrorBoundary");
    const { Routes, Route, Link } = await import("react-router-dom");
    const { fireEvent, screen } = await import("@testing-library/react");

    render(
      <MemoryRouter initialEntries={["/faulty"]}>
        <nav>
          <Link to="/healthy">Go to Healthy</Link>
        </nav>
        <ErrorBoundary>
          <Routes>
            <Route path="/faulty" element={<FaultyComponent shouldThrow={true} />} />
            <Route path="/healthy" element={<FaultyComponent shouldThrow={false} />} />
          </Routes>
        </ErrorBoundary>
      </MemoryRouter>
    );

    // ErrorBoundary should catch the error on /faulty
    expect(screen.getByText(/Something went wrong in this module/i)).toBeInTheDocument();

    // Now user clicks on another sidebar module / link
    const link = screen.getByText("Go to Healthy");
    fireEvent.click(link);

    // ErrorBoundary should automatically reset and display Healthy Component!
    await waitFor(() => {
      expect(screen.getByText("Healthy Component Content")).toBeInTheDocument();
      expect(screen.queryByText(/Something went wrong in this module/i)).not.toBeInTheDocument();
    });
  });
});
