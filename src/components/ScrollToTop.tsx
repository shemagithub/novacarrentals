import { useEffect } from "react";
import { useLocation } from "wouter";

function scrollWindowToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/** Scroll to top whenever the marketing site route changes. */
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    scrollWindowToTop();
  }, [location]);

  return null;
}
