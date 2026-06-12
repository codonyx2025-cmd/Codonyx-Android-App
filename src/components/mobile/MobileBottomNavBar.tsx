import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useNotifications } from "@/hooks/useNotifications";
import MobileBottomNavigation, {
  type MobileNavRole,
  type MobileNavTab,
} from "./MobileBottomNavigation";

/**
 * Site-wide wrapper around MobileBottomNavigation.
 *
 * - Visible on small screens only (the inner component already uses `md:hidden`).
 * - Hidden on /auth, /register*, /reset-password to keep onboarding flows clean.
 * - When logged out: shows a default bar (advisor layout) and any tab that
 *   requires an account (connections, notifications, profile, deals) routes
 *   the user to `/auth`. Public tabs (Home, Labs, Advisors) work normally.
 * - When logged in: derives the role from the user's profile and the active
 *   tab from the current route. Shows unread notification badge.
 */

const HIDDEN_PREFIXES = ["/auth", "/register", "/reset-password", "/~oauth"];

function routeToTab(pathname: string, role: MobileNavRole): MobileNavTab | null {
  if (pathname === "/" || pathname.startsWith("/dashboard")) return "home";
  if (pathname.startsWith("/connections")) return "connections";
  if (pathname.startsWith("/notifications")) return "notifications";
  if (pathname.startsWith("/services")) return "labs";
  if (pathname.startsWith("/laboratories")) return role === "advisor" ? "labs" : null;
  if (pathname.startsWith("/advisors")) return role === "lab" ? "advisors" : null;
  if (pathname.startsWith("/distributor-dashboard")) return role === "distributor" ? "deals" : "profile";
  if (pathname.startsWith("/edit-profile") || pathname.startsWith("/profile")) {
    return "profile";
  }
  return null;
}

export default function MobileBottomNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isReady, user } = useAuthReady();
  const [role, setRole] = useState<MobileNavRole>("advisor");
  const [profileId, setProfileId] = useState<string | null>(null);

  const isHidden = HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setProfileId(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, user_type")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      setProfileId(data.id);
      if (data.user_type === "distributor") setRole("distributor");
      else if (data.user_type === "laboratory") setRole("lab");
      else setRole("advisor");
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const { unreadCount } = useNotifications(profileId);

  const activeTab = useMemo<MobileNavTab>(() => {
    const t = routeToTab(location.pathname, role);
    return t ?? "home";
  }, [location.pathname, role]);

  if (isHidden || !isReady) return null;

  // Logged out: intercept account-required tabs and send to /auth.
  if (!user) {
    return (
      <div
        onClickCapture={(e) => {
          const btn = (e.target as HTMLElement).closest("button[aria-label]");
          if (!btn) return;
          const label = btn.getAttribute("aria-label");
          if (
            label === "Connections" ||
            label === "Notifications" ||
            label === "Profile" ||
            label === "Deals"
          ) {
            e.preventDefault();
            e.stopPropagation();
            navigate("/auth");
          }
        }}
      >
        <MobileBottomNavigation userRole="advisor" activeTab={activeTab} isLoggedOut />
      </div>
    );
  }

  return (
    <MobileBottomNavigation
      userRole={role}
      activeTab={activeTab}
      notificationCount={unreadCount}
      profileHref={profileId ? `/profile/${profileId}` : "/dashboard"}
    />
  );
}