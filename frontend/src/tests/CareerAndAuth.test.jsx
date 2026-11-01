import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { InferredSkillsWidget } from "../components/career/InferredSkillsWidget";
import { CodingStatsWidget } from "../components/career/CodingStatsWidget";
import { GitHubProjectSelector } from "../components/career/GitHubProjectSelector";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { AuthProvider } from "../context/AuthContext";

describe("Career Intelligence Resilience & Form Autofill Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("InferredSkillsWidget", () => {
    it("returns null when no connected platforms provide inferred skills", () => {
      const { container } = render(
        <InferredSkillsWidget platforms={[]} userSkills={[]} onAddSkill={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("handles malformed userSkills safely without throwing TypeError", () => {
      const platforms = [
        {
          platform: "github",
          connectionStatus: "connected",
          importedData: {
            topLanguages: ["TypeScript", "Python"],
            repos: [
              { techStack: ["React", "TailwindCSS"] },
              { techStack: null }
            ]
          }
        }
      ];

      // Test with strings, undefined, null, and objects with name instead of skillName
      const malformedSkills = [
        "JavaScript",
        null,
        undefined,
        { name: "TypeScript" },
        { skillName: "Python", currentLevel: 80 }
      ];

      render(
        <InferredSkillsWidget
          platforms={platforms}
          userSkills={malformedSkills}
          onAddSkill={vi.fn()}
        />
      );

      expect(screen.getByText(/Inferred Technical Competencies/i)).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
      expect(screen.getByText("Python")).toBeInTheDocument();
      expect(screen.getByText("React")).toBeInTheDocument();
    });
  });

  describe("CodingStatsWidget", () => {
    it("returns null when neither LeetCode nor Codeforces is connected", () => {
      const { container } = render(
        <CodingStatsWidget
          leetcodeConnection={{ connectionStatus: "disconnected" }}
          codeforcesConnection={{ connectionStatus: "disconnected" }}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders LeetCode stats safely with missing or string numbers", () => {
      const leetcode = {
        platform: "leetcode",
        connectionStatus: "connected",
        verificationStatus: "api_verified",
        importedData: {
          totalSolved: "150",
          easy: "70",
          medium: "60",
          hard: "20",
          contestRating: "1850.5"
        }
      };

      render(<CodingStatsWidget leetcodeConnection={leetcode} />);
      expect(screen.getByText("LeetCode Practice")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument();
      expect(screen.getByText("1851")).toBeInTheDocument();
    });

    it("renders Codeforces stats safely with rank and rating", () => {
      const codeforces = {
        platform: "codeforces",
        connectionStatus: "connected",
        verificationStatus: "api_verified",
        importedData: {
          rating: 1420,
          rank: "specialist",
          maxRating: 1510,
          contestCount: 12,
          contribution: 5
        }
      };

      render(<CodingStatsWidget codeforcesConnection={codeforces} />);
      expect(screen.getByText("Codeforces Rating")).toBeInTheDocument();
      expect(screen.getByText("1420")).toBeInTheDocument();
      expect(screen.getAllByText(/specialist/i).length).toBeGreaterThan(0);
    });
  });

  describe("GitHubProjectSelector", () => {
    it("handles null connection or repos gracefully", () => {
      const { container } = render(
        <GitHubProjectSelector
          githubConnection={{ connectionStatus: "disconnected" }}
          onSaveSelected={vi.fn()}
          onSyncToResume={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders repos and allows selection toggle", () => {
      const githubConnection = {
        platform: "github",
        connectionStatus: "connected",
        importedData: {
          repos: [
            {
              id: "repo-101",
              name: "nexora-engine",
              description: "AI productivity engine",
              language: "TypeScript",
              stars: 42,
              forks: 5,
              url: "https://github.com/user/nexora-engine"
            }
          ]
        },
        selectedItems: []
      };

      render(
        <GitHubProjectSelector
          githubConnection={githubConnection}
          onSaveSelected={vi.fn()}
          onSyncToResume={vi.fn()}
        />
      );

      expect(screen.getByText("nexora-engine")).toBeInTheDocument();
      expect(screen.getByText("AI productivity engine")).toBeInTheDocument();

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe("Auth Form Autofill UX", () => {
    it("renders Login form with proper input IDs and autoComplete credentials", () => {
      render(
        <AuthProvider>
          <BrowserRouter>
            <Login />
          </BrowserRouter>
        </AuthProvider>
      );

      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toHaveAttribute("id", "login-email");
      expect(emailInput).toHaveAttribute("name", "email");
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("autocomplete", "username email");

      const passwordInput = screen.getByLabelText(/Password/i);
      expect(passwordInput).toHaveAttribute("id", "login-password");
      expect(passwordInput).toHaveAttribute("name", "password");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
    });

    it("pre-fills saved email in Login if stored in localStorage", () => {
      localStorage.setItem("nexora_last_email", "student@stanford.edu");

      render(
        <AuthProvider>
          <BrowserRouter>
            <Login />
          </BrowserRouter>
        </AuthProvider>
      );

      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput.value).toBe("student@stanford.edu");
    });

    it("renders Register form with proper input IDs and autoComplete credentials", () => {
      render(
        <AuthProvider>
          <BrowserRouter>
            <Register />
          </BrowserRouter>
        </AuthProvider>
      );

      const nameInput = screen.getByLabelText(/Full Name/i);
      expect(nameInput).toHaveAttribute("id", "register-name");
      expect(nameInput).toHaveAttribute("name", "name");
      expect(nameInput).toHaveAttribute("autocomplete", "name");

      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toHaveAttribute("id", "register-email");
      expect(emailInput).toHaveAttribute("name", "email");
      expect(emailInput).toHaveAttribute("autocomplete", "username email");

      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      expect(passwordInputs.length).toBeGreaterThan(0);
      expect(screen.getByLabelText(/^Password/i)).toHaveAttribute("autocomplete", "new-password");
      expect(screen.getByLabelText(/Confirm Password/i)).toHaveAttribute("autocomplete", "new-password");
    });
  });
});
