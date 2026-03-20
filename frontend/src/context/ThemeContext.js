import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

const LS_KEY = "taskflow_theme";

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    // Restore from localStorage on first load
    try {
      return localStorage.getItem(LS_KEY) || "dark";
    } catch {
      return "dark";
    }
  });

  // Apply theme class to <html> element and persist to localStorage
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(LS_KEY, theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () =>
    setThemeState((t) => (t === "dark" ? "light" : "dark"));
  const setTheme = (t) => setThemeState(t);

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, setTheme, isDark: theme === "dark" }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
