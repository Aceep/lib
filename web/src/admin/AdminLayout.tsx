import { NavLink, Outlet } from "react-router";

/** Shared frame of the admin pages: the section tabs, then the page itself. */
export function AdminLayout({ pendingUploadCount }: { pendingUploadCount: number }) {
  return (
    <main className="page">
      <nav className="admin-tabs" aria-label="Administration">
        <NavLink to="/admin" end className="nav-link">
          Activité
        </NavLink>
        <NavLink to="/admin/uploads" className="nav-link">
          Envois à valider
          {pendingUploadCount > 0 ? <span className="count-badge">{pendingUploadCount}</span> : null}
        </NavLink>
        <NavLink to="/admin/health" className="nav-link">
          Santé
        </NavLink>
        <NavLink to="/admin/users" className="nav-link">
          Utilisateurs
        </NavLink>
      </nav>
      <Outlet />
    </main>
  );
}
