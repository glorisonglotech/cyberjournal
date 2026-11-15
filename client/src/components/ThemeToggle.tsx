import { Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "../hooks/useTheme";

const MODES: Array<{ mode: Theme; Icon: typeof Sun }> = [
  { mode: "light", Icon: Sun },
  { mode: "dark", Icon: Moon },
];

/**
 * A two-position instrument switch rather than a novelty toggle: each mode is
 * a real button with aria-pressed, so it works with keyboard and screen readers.
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-switch" role="group" aria-label="Colour theme">
      {MODES.map(({ mode, Icon }) => {
        const active = theme === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => setTheme(mode)}
            data-active={active}
            aria-pressed={active}
            aria-label={`${mode} theme`}
            title={`${mode} theme`}
          >
            <Icon size={11} strokeWidth={1.75} aria-hidden="true" />
            {!compact && <span>{mode}</span>}
          </button>
        );
      })}
    </div>
  );
}
