import { useEffect, useRef } from "react";

export interface ShortcutHandlers {
  onPrev: () => void;
  onNext: () => void;
  onToggleAutoPlay: () => void;
  /** False leaves Space to the browser (scrolling lesson pages). */
  spaceEnabled?: boolean;
}

/** True when the key press belongs to a control that uses these keys itself. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") return true; // text fields and range sliders both use arrows/space
  const role = target.getAttribute("role");
  return role === "radio" || role === "slider" || role === "switch" || role === "tab";
}

/** ArrowLeft / ArrowRight step through the lesson, Space toggles Auto-Play. */
export function useKeyboardShortcuts(enabled: boolean, handlers: ShortcutHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (isEditableTarget(e.target)) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        ref.current.onPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        ref.current.onNext();
      } else if ((e.key === " " || e.code === "Space") && ref.current.spaceEnabled !== false) {
        // A focused button activates on Space natively; leave it alone.
        if (e.target instanceof HTMLButtonElement) return;
        e.preventDefault();
        ref.current.onToggleAutoPlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
