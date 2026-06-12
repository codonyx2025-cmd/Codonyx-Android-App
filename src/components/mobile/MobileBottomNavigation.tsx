import { useNavigate } from "react-router-dom";
import {
  Home,
  FlaskConical,
  Users,
  Bell,
  User,
  GraduationCap,
  Handshake,
  Compass,
  LucideIcon,
} from "lucide-react";

/**
 * MobileBottomNavigation
 * ----------------------
 * Standalone, reusable LinkedIn-style bottom navigation bar for mobile.
 * Drop into any page and pass `userRole` + `activeTab`.
 *
 * Example:
 *   <MobileBottomNavigation userRole="distributor" activeTab="home" />
 *
 * Notes:
 *  - Self-contained: only depends on react-router-dom + lucide-react + tailwind.
 *  - Safe-area aware (iOS notch / Android gesture bar).
 *  - Distributor "Deals" tab scrolls to #deals-section if already on the
 *    distributor dashboard, otherwise navigates there and then scrolls.
 */

export type MobileNavRole = "advisor" | "lab" | "distributor";
export type MobileNavTab =
  | "home"
  | "labs"
  | "advisors"
  | "connections"
  | "deals"
  | "notifications"
  | "profile";

interface MobileBottomNavigationProps {
  userRole: MobileNavRole;
  activeTab: MobileNavTab;
  /** Optional badge count to show on the notifications tab */
  notificationCount?: number;
  /** Optional className for the outer <nav> */
  className?: string;
  /** Optional override for the profile route (defaults to /dashboard) */
  profileHref?: string;
  /** When true, swap logged-in-only tabs for public ones (e.g. Labs -> Explore) and route Home to "/" */
  isLoggedOut?: boolean;
}

interface NavItem {
  key: MobileNavTab;
  label: string;
  icon: LucideIcon;
  href: string;
  onClick?: (navigate: ReturnType<typeof useNavigate>) => void;
}

function buildItems(role: MobileNavRole, profileHref: string, isLoggedOut = false): NavItem[] {
  const home: NavItem = {
    key: "home",
    label: "Home",
    icon: Home,
    href: isLoggedOut ? "/" : "/dashboard",
  };
  const connections: NavItem = {
    key: "connections",
    label: "Connections",
    icon: Users,
    href: "/connections",
  };
  const notifications: NavItem = {
    key: "notifications",
    label: "Notifications",
    icon: Bell,
    href: "/notifications",
  };
  const profile: NavItem = {
    key: "profile",
    label: "Profile",
    icon: User,
    href: profileHref,
  };

  if (role === "advisor") {
    const second: NavItem = isLoggedOut
      ? { key: "labs", label: "Explore", icon: Compass, href: "/services" }
      : { key: "labs", label: "Labs", icon: FlaskConical, href: "/laboratories" };
    return [home, second, connections, notifications, profile];
  }

  if (role === "lab") {
    return [
      home,
      { key: "advisors", label: "Advisors", icon: GraduationCap, href: "/advisors" },
      connections,
      notifications,
      profile,
    ];
  }

  // distributor
  return [
    home,
    connections,
    {
      key: "deals",
      label: "Deals",
      icon: Handshake,
      href: "/distributor-dashboard#deals-section",
      onClick: (navigate) => {
        const el = document.getElementById("deals-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          navigate("/distributor-dashboard");
          // Try to scroll after navigation has rendered.
          setTimeout(() => {
            document
              .getElementById("deals-section")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 400);
        }
      },
    },
    notifications,
    profile,
  ];
}

export default function MobileBottomNavigation({
  userRole,
  activeTab,
  notificationCount = 0,
  className = "",
  profileHref = "/dashboard",
  isLoggedOut = false,
}: MobileBottomNavigationProps) {
  const navigate = useNavigate();
  const items = buildItems(userRole, profileHref, isLoggedOut);

  return (
    <nav
      aria-label="Primary"
      className={
        "fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 " +
        "shadow-[0_-1px_8px_rgba(0,0,0,0.04)] " +
        "pb-[env(safe-area-inset-bottom)] md:hidden " +
        className
      }
    >
      <ul className="flex items-stretch justify-between px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === activeTab;
          const showBadge = item.key === "notifications" && notificationCount > 0;

          return (
            <li key={item.key} className="flex-1">
              <button
                type="button"
                onClick={() => {
                  if (item.onClick) item.onClick(navigate);
                  else navigate(item.href);
                }}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={
                  "relative flex w-full flex-col items-center justify-center " +
                  "gap-0.5 py-2 px-1 transition-colors duration-200 " +
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 " +
                  "active:scale-[0.96] transition-transform " +
                  (isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-800")
                }
              >
                <span className="relative inline-flex">
                  {(() => {
                    // Home icon: don't fill on active — keeps the door visible.
                    // Other icons: fill on active for that LinkedIn-style "solid" look.
                    const fillOnActive = item.key !== "home" && item.icon !== Compass;
                    return (
                      <Icon
                        className="h-6 w-6"
                        strokeWidth={isActive ? 2.4 : 2}
                        fill={isActive && fillOnActive ? "currentColor" : "none"}
                        style={
                          isActive && fillOnActive
                            ? { fill: "currentColor", stroke: "currentColor" }
                            : undefined
                        }
                      />
                    );
                  })()}
                  {showBadge && (
                    <span
                      className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1
                      flex items-center justify-center rounded-full
                      bg-red-500 text-white text-[10px] font-bold leading-none"
                    >
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </span>
                <span
                  className={
                    "text-[11px] leading-tight " +
                    (isActive ? "font-semibold" : "font-medium")
                  }
                >
                  {item.label}
                </span>
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-b bg-gray-900"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { MobileBottomNavigation };