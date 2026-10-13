"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_STORAGE_KEY = "hementiras-theme";
const THEME_CHANGE_EVENT = "hementiras:theme-change";

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getThemeSnapshot(): Theme {
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
}

function getServerThemeSnapshot(): Theme {
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const nextTheme = getThemeSnapshot() === "dark" ? "light" : "dark";
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("ThemeToggle must be used within ThemeProvider.");
  const label = context.theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={context.theme === "light"}
      onClick={context.toggleTheme}
      className="theme-toggle-switch"
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span
          className="theme-toggle-indicator"
          style={{ transform: `translateX(${context.theme === "light" ? "100%" : "0"})` }}
        />
        <span className={`theme-toggle-icon${context.theme === "dark" ? " theme-toggle-icon--active" : ""}`}>
          <Moon size={16} />
        </span>
        <span className={`theme-toggle-icon${context.theme === "light" ? " theme-toggle-icon--active" : ""}`}>
          <Sun size={16} />
        </span>
      </span>
    </button>
  );
}