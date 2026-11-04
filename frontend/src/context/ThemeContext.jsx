import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({
  theme: "dark",
  toggleTheme: () => {},
  setThemeMode: () => {},
  isDay: false,
  isNight: true,
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem("nexora_theme");
      if (stored === "light" || stored === "dark") return stored;
      return "light"; // Default to light / day mode for clean SaaS aesthetic
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = typeof document !== "undefined" ? document.body : null;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      if (body) {
        body.classList.add("light");
        body.classList.remove("dark");
        body.setAttribute("data-theme", "light");
      }
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
      if (body) {
        body.classList.add("dark");
        body.classList.remove("light");
        body.setAttribute("data-theme", "dark");
      }
    }
    try {
      localStorage.setItem("nexora_theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setThemeMode = (mode) => {
    if (mode === "light" || mode === "dark") {
      setTheme(mode);
    }
  };

  const value = {
    theme,
    toggleTheme,
    setThemeMode,
    isDay: theme === "light",
    isNight: theme === "dark",
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
