import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Detect Supabase recovery links (#access_token=...&type=recovery) or PKCE code (?code=...)
// and ensure we land on the dedicated reset page even if redirected elsewhere.
export default function RecoveryRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = location.hash || window.location.hash;
    const search = location.search || window.location.search;
    const hasRecoveryHash = !!hash && hash.includes("type=recovery");
    const hasPkceCode = !!search && search.includes("code=");

    if ((hasRecoveryHash || hasPkceCode) && location.pathname !== "/auth/reset") {
      navigate(`/auth/reset${search}${hash}`, { replace: true });
    }
  }, [location, navigate]);

  return null;
}
