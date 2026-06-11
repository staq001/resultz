import { type ReactNode } from "react";
import type { SidebarNavItem } from "../types/app.types";

type PortalShellProps = {
  userName: string;
  avatarUrl?: string | null;
  navItems: SidebarNavItem[];
  children: ReactNode;
  onSignOut?: () => void | Promise<void>;
  showProfile?: boolean;
  hideSidebar?: boolean;
};

export function PortalShell({
  userName,
  avatarUrl,
  navItems,
  children,
  onSignOut,
  showProfile = true,
  hideSidebar = false,
}: PortalShellProps) {
  return (
    <div className={hideSidebar ? "portal-shell portal-shell-full" : "portal-shell"}>
      {!hideSidebar && (
        <aside className="portal-sidebar">
          {showProfile && (
            <div className="portal-profile">
              <div className="portal-profile-grid">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`${userName || "User"} avatar`}
                    className="portal-avatar portal-avatar-image"
                  />
                ) : (
                  <div className="portal-avatar">
                    {(userName || "U").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <h3>{userName || "User"}</h3>
              </div>
            </div>
          )}

          <nav className="portal-nav" aria-label="Portal navigation">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className={
                  item.isActive ? "portal-nav-item active" : "portal-nav-item"
                }
                onClick={item.onClick}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {onSignOut && (
            <button type="button" className="portal-logout" onClick={onSignOut}>
              Logout
            </button>
          )}
        </aside>
      )}

      <section className="portal-main">{children}</section>
    </div>
  );
}
