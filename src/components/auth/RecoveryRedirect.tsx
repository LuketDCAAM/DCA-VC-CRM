import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Detects Supabase recovery links like #access_token=...&type=recovery
// and ensures we land on the dedicated reset page even if the platform
// redirects to the root URL.
export default function RecoveryRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = location.hash || window.location.hash;
    if (hash && hash.includes("type=recovery") && location.pathname !== "/auth/reset") {
      // Preserve existing search/hash if present
      navigate(`/auth/reset${location.search}${location.hash}`, { replace: true });
    }
  }, [location, navigate]);

  return null;
}
