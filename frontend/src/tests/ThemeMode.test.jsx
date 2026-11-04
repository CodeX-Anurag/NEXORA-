import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { Navbar } from "../components/layout/Navbar";
import { Sidebar } from "../components/layout/Sidebar";
import { AuthProvider } from "../context/AuthContext";
import { BrowserRouter } from "react-router-dom";

const ThemeConsumer = () => {
  const { theme, toggleTheme, isDay, isNight } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <span data-testid="is-day">{String(isDay)}</span>
      <span data-testid="is-night">{String(isNight)}</span>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};

describe("ThemeContext Day & Night Mode Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to light (Day Mode) initially for clean SaaS interface", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme-value").textContent).toBe("light");
    expect(screen.getByTestId("is-day").textContent).toBe("true");
    expect(screen.getByTestId("is-night").textContent).toBe("false");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("toggles from Day Mode to Night Mode and persists to localStorage", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    const button = screen.getByText("Toggle Theme");
    act(() => {
      fireEvent.click(button);
    });

    expect(screen.getByTestId("theme-value").textContent).toBe("dark");
    expect(screen.getByTestId("is-day").textContent).toBe("false");
    expect(screen.getByTestId("is-night").textContent).toBe("true");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("nexora_theme")).toBe("dark");

    // Toggle back to Day Mode
    act(() => {
      fireEvent.click(button);
    });

    expect(screen.getByTestId("theme-value").textContent).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("nexora_theme")).toBe("light");
  });

  it("restores stored dark theme from localStorage on load", () => {
    localStorage.setItem("nexora_theme", "dark");

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme-value").textContent).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("renders Day/Night toggle button in Navbar and toggles state", () => {
    render(
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Navbar apiStatus="healthy" onToggleMobileMenu={vi.fn()} onRefreshHealth={vi.fn()} />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    );

    const toggleBtn = screen.getByLabelText(/switch to night mode/i);
    expect(toggleBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(toggleBtn);
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(screen.getByLabelText(/switch to day mode/i)).toBeInTheDocument();
  });

  it("renders Day/Night toggle button in Sidebar footer", () => {
    render(
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Sidebar mobileOpen={false} onCloseMobile={vi.fn()} />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    );

    const sidebarToggle = screen.getByTitle(/switch to night mode/i);
    expect(sidebarToggle).toBeInTheDocument();

    act(() => {
      fireEvent.click(sidebarToggle);
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(screen.getByTitle(/switch to day mode/i)).toBeInTheDocument();
  });
});
