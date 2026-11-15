import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "gcj-theme";
const EVENT = "gcj-theme";
const QUERY = "(prefers-color-scheme: dark)";

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia(QUERY).matches ? "dark" : "light";
}

/** The pre-paint script in index.html has already decided; trust the DOM. */
function currentTheme(): Theme {
  const attr = document.documentElement.dataset.theme;
  if (attr === "dark" || attr === "light") return attr;
  return storedTheme() ?? systemTheme();
}

function applyTheme(theme: Theme, persist: boolean) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage can be blocked; the session still switches */
    }
  }

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = theme === "light" ? "#FAFAFA" : "#050505";
}

function broadcast(theme: Theme) {
  window.dispatchEvent(new CustomEvent<Theme>(EVENT, { detail: theme }));
}

/**
 * Two explicit themes, resolved from localStorage or the OS preference.
 * Every mounted switch stays in sync through a document-level event.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<Theme>).detail;
      setTheme(next === "dark" ? "dark" : "light");
    };
    window.addEventListener(EVENT, onChange);

    // Follow the OS only while the visitor has not chosen a theme.
    const media = window.matchMedia(QUERY);
    const onSystemChange = () => {
      if (storedTheme()) return;
      const next = media.matches ? "dark" : "light";
      applyTheme(next, false);
      broadcast(next);
    };
    media.addEventListener("change", onSystemChange);

    return () => {
      window.removeEventListener(EVENT, onChange);
      media.removeEventListener("change", onSystemChange);
    };
  }, []);

  const set = (next: Theme) => {
    applyTheme(next, true);
    broadcast(next);
  };

  const toggle = () => {
    set(currentTheme() === "light" ? "dark" : "light");
  };

  return { theme, setTheme: set, toggle };
}
