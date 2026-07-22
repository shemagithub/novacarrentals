import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function scrollWindowToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/** Scroll to top whenever the admin route changes. */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollWindowToTop();
  }, [pathname]);

  return null;
}
