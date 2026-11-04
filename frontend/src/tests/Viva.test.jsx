import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import Viva from "../pages/Viva";
import vivaService from "../services/viva.service";
import authService from "../services/auth.service";

describe("AI Socratic Viva Service and Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("nexora_token", "test-token");
    localStorage.setItem(
      "nexora_user",
      JSON.stringify({
        _id: "user123",
        name: "Test Student",
        email: "student@example.com",
        role: "student"
      })
    );

    vi.spyOn(authService, "refresh").mockResolvedValue({
      accessToken: "test-token",
      user: { _id: "user123", name: "Test Student", email: "student@example.com" }
    });
    vi.spyOn(authService, "getProfile").mockResolvedValue({
      user: { _id: "user123", name: "Test Student", email: "student@example.com" }
    });
  });

  describe("vivaService interface completeness", () => {
    it("exports all expected Viva methods and aliases", () => {
      expect(typeof vivaService.startVivaSession).toBe("function");
      expect(typeof vivaService.startSession).toBe("function");
      expect(typeof vivaService.submitVivaAnswer).toBe("function");
      expect(typeof vivaService.submitAnswer).toBe("function");
      expect(typeof vivaService.getVivaHistory).toBe("function");
      expect(typeof vivaService.getHistory).toBe("function");
      expect(typeof vivaService.createTasksFromViva).toBe("function");
      expect(typeof vivaService.convertRecommendationsToTasks).toBe("function");
      expect(typeof vivaService.getVivaSessionById).toBe("function");
      expect(typeof vivaService.getSessionById).toBe("function");
    });

    it("startVivaSession normalizes activeRound from session.rounds", async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          session: {
            _id: "session_123",
            topic: "React",
            currentRound: 1,
            maxRounds: 3,
            rounds: [{ roundNumber: 1, question: "What is reconciliation?" }]
          }
        })
      });

      const res = await vivaService.startVivaSession("fake-token", { topic: "React" });
      expect(res.success).toBe(true);
      expect(res.activeRound).toBeDefined();
      expect(res.activeRound.question).toBe("What is reconciliation?");
      global.fetch = originalFetch;
    });

    it("submitVivaAnswer normalizes nextRound and isFinished flags", async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          isCompleted: false,
          session: {
            _id: "session_123",
            currentRound: 2,
            rounds: [
              { roundNumber: 1, question: "Q1" },
              { roundNumber: 2, question: "Q2 follow-up" }
            ]
          }
        })
      });

      const res = await vivaService.submitVivaAnswer("fake-token", "session_123", {
        roundNumber: 1,
        studentAnswer: "My answer"
      });
      expect(res.isFinished).toBe(false);
      expect(res.nextRound).toBeDefined();
      expect(res.nextRound.question).toBe("Q2 follow-up");
      global.fetch = originalFetch;
    });
  });

  describe("Viva Component Flow", () => {
    it("starts a viva session without throwing startVivaSession is not a function", async () => {
      vi.spyOn(vivaService, "getVivaHistory").mockResolvedValue({
        success: true,
        history: [],
        sessions: []
      });

      vi.spyOn(vivaService, "startVivaSession").mockResolvedValue({
        success: true,
        session: {
          _id: "session_test_1",
          topic: "React & Modern Frontend",
          difficulty: "Intermediate",
          maxRounds: 3,
          currentRound: 1,
          rounds: [
            {
              roundNumber: 1,
              question: "Can you explain how React's Virtual DOM works?"
            }
          ]
        },
        activeRound: {
          roundNumber: 1,
          question: "Can you explain how React's Virtual DOM works?"
        }
      });

      render(
        <AuthProvider>
          <MemoryRouter>
            <Viva />
          </MemoryRouter>
        </AuthProvider>
      );

      // Verify setup screen loads
      expect(screen.getByText(/1\. Select or Customize Viva Topic/i)).toBeInTheDocument();

      // Click "Enter Viva Room & Begin Defense"
      const startButton = screen.getByRole("button", { name: /Enter Viva Room & Begin Defense/i });
      fireEvent.click(startButton);

      // Verify it transitions to active viva chamber and shows question
      await waitFor(() => {
        expect(screen.getByText(/Round 1 of 3/i)).toBeInTheDocument();
        expect(screen.getByText(/"Can you explain how React's Virtual DOM works\?"/i)).toBeInTheDocument();
      });

      // Verify that the error banner "vivaService.startVivaSession is not a function" does NOT exist
      expect(screen.queryByText(/vivaService\.startVivaSession is not a function/i)).not.toBeInTheDocument();
    });

    it("displays voice language options and handles microphone permission rejection gracefully", async () => {
      vi.spyOn(vivaService, "getVivaHistory").mockResolvedValue({
        success: true,
        history: [],
        sessions: []
      });

      vi.spyOn(vivaService, "startVivaSession").mockResolvedValue({
        success: true,
        session: {
          _id: "session_test_2",
          topic: "Node.js & Backend Architecture",
          difficulty: "Intermediate",
          maxRounds: 3,
          currentRound: 1,
          rounds: [{ roundNumber: 1, question: "Explain the Node.js event loop phases." }]
        },
        activeRound: {
          roundNumber: 1,
          question: "Explain the Node.js event loop phases."
        }
      });

      // Mock navigator.mediaDevices.getUserMedia rejecting with NotAllowedError
      const originalMediaDevices = navigator.mediaDevices;
      const notAllowedErr = new Error("Permission denied");
      notAllowedErr.name = "NotAllowedError";
      navigator.mediaDevices = {
        getUserMedia: vi.fn().mockRejectedValue(notAllowedErr)
      };

      render(
        <AuthProvider>
          <MemoryRouter>
            <Viva />
          </MemoryRouter>
        </AuthProvider>
      );

      const startButton = screen.getByRole("button", { name: /Enter Viva Room & Begin Defense/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/Round 1 of 3/i)).toBeInTheDocument();
      });

      // The microphone button should be available
      const micButton = screen.getByRole("button", { name: /Click to Speak Answer/i });
      expect(micButton).toBeInTheDocument();

      // Click to speak -> triggers permission rejection
      fireEvent.click(micButton);

      // Verify permission rejection banner appears
      await waitFor(() => {
        expect(screen.getByText(/Microphone access was denied/i)).toBeInTheDocument();
      });

      // Student can type answer manually
      const textarea = screen.getByPlaceholderText(/Speak clearly using the microphone button or type/i);
      fireEvent.change(textarea, { target: { value: "The event loop has timers, pending callbacks, poll, check, and close callbacks." } });
      expect(textarea.value).toContain("event loop");

      // Restore navigator.mediaDevices
      navigator.mediaDevices = originalMediaDevices;
    });
  });
});
