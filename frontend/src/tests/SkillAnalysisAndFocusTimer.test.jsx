import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { RichMarkdownRenderer } from "../components/ai/RichMarkdownRenderer";
import { StudyFocusModal } from "../components/study/StudyFocusModal";

describe("AI Skill Analysis Formatting & Study Focus Timer Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("RichMarkdownRenderer - LaTeX and Interactive Chart", () => {
    it("renders LaTeX math formula without displaying raw symbol names like \\frac, \\text, \\sum, \\times", () => {
      const mathContent = `The mathematical formula governing your readiness score $R$ across $n$ domains:

$$R = \\frac{1}{n}\\sum_{i=1}^{n}\\left(\\frac{\\text{Current Level}_i}{\\text{Required Level}_i}\\times 100\\right)$$`;

      const { container } = render(<RichMarkdownRenderer content={mathContent} />);

      // Symbol names must NOT be visible as raw LaTeX tokens
      expect(screen.queryByText(/\\frac/i)).toBeNull();
      expect(screen.queryByText(/\\text/i)).toBeNull();
      expect(screen.queryByText(/\\sum/i)).toBeNull();
      expect(screen.queryByText(/\\times/i)).toBeNull();
      expect(screen.queryByText(/\\left/i)).toBeNull();
      expect(screen.queryByText(/\\right/i)).toBeNull();

      // Formatted unicode symbols must be rendered
      expect(container.textContent).toContain("∑");
      expect(container.textContent).toContain("×");
      expect(container.textContent).toContain("Current Level");
      expect(container.textContent).toContain("Required Level");
    });

    it("renders ```chart code blocks with title, data, and colors correctly", async () => {
      const chartContent = `Let's examine your precise skill gaps using the breakdown below:

\`\`\`chart
{
  "type": "bar",
  "title": "Skill Gaps for Full Stack Developer Role",
  "xAxisKey": "skillName",
  "yAxisLabel": "Gap Percentage (%)",
  "data": [
    {"skillName": "React", "value": 80},
    {"skillName": "Node.js", "value": 80},
    {"skillName": "JavaScript", "value": 15}
  ],
  "series": [
    {"key": "value", "name": "Skill Gap (%)", "color": "#FF6B6B"}
  ]
}
\`\`\``;

      render(<RichMarkdownRenderer content={chartContent} />);

      // Raw json must NOT be rendered as a raw json string
      expect(screen.queryByText('"skillName": "React"')).toBeNull();

      // Chart title and interactive elements must be present
      expect(screen.getByText("Skill Gaps for Full Stack Developer Role")).toBeInTheDocument();
      expect(screen.getByText("Gap Percentage (%)")).toBeInTheDocument();
      expect(screen.getByText("View Data")).toBeInTheDocument();

      // Clicking View Data should display tabular data with skills
      fireEvent.click(screen.getByText("View Data"));
      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("Node.js")).toBeInTheDocument();
      expect(screen.getByText("JavaScript")).toBeInTheDocument();
    });
  });

  describe("StudyFocusModal Component", () => {
    it("renders focus modal with subject and duration presets", () => {
      render(
        <StudyFocusModal
          isOpen={true}
          onClose={vi.fn()}
          initialSubject="DSA & Algorithms"
          onFocusComplete={vi.fn()}
        />
      );

      expect(screen.getByText("Study Focus Session")).toBeInTheDocument();
      expect(screen.getAllByText("DSA & Algorithms").length).toBeGreaterThan(0);
      expect(screen.getByText("25m Pomodoro")).toBeInTheDocument();
      expect(screen.getByText("Start Focus")).toBeInTheDocument();
      expect(screen.getByText("25:00")).toBeInTheDocument();
    });

    it("allows switching duration and starting timer", () => {
      render(
        <StudyFocusModal
          isOpen={true}
          onClose={vi.fn()}
          initialSubject="Web Development"
          onFocusComplete={vi.fn()}
        />
      );

      // Select 15m Sprint
      fireEvent.click(screen.getByText("15m Sprint"));
      expect(screen.getByText("15:00")).toBeInTheDocument();

      // Click Start Focus
      const startBtn = screen.getByText("Start Focus");
      fireEvent.click(startBtn);

      // Timer should switch to Pause state
      expect(screen.getByText("Pause")).toBeInTheDocument();
    });

    it("calls onFocusComplete with elapsed duration and subject when finished", async () => {
      const handleComplete = vi.fn().mockResolvedValue({});
      const handleClose = vi.fn();

      render(
        <StudyFocusModal
          isOpen={true}
          onClose={handleClose}
          initialSubject="DBMS & SQL"
          onFocusComplete={handleComplete}
        />
      );

      // Start focus timer
      fireEvent.click(screen.getByText("Start Focus"));

      // Advance time slightly
      act(() => {
        // Fast-forward or trigger finish
      });

      // Finish button appears when active or time elapsed
      const finishBtn = screen.getByText("Finish");
      fireEvent.click(finishBtn);

      // Save & Log button should appear
      expect(screen.getByText(/Focus Block Accomplished!/i)).toBeInTheDocument();
      const saveBtn = screen.getByText(/Save & Log to Study History/i);
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(handleComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: "DBMS & SQL",
            duration: expect.any(Number)
          })
        );
        expect(handleClose).toHaveBeenCalled();
      });
    });
  });
});
