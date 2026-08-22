import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../App";

global.fetch = vi.fn();

describe("NEXORA Frontend Phase 5 AI Foundation Shell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders branding and Phase 5 AI Coach navigation", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes("/health")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, message: "NEXORA API is healthy", service: "nexora-api" })
        });
      }
      return Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({ success: false, message: "No active session" })
      });
    });

    render(<App />);

    expect(screen.getAllByText("NEXORA").length).toBeGreaterThan(0);
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/Study Tracker/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Career Intelligence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Projects Portfolio/i)).toBeInTheDocument();
    expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Coach/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    });
  });
});
