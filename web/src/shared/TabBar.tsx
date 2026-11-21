import { NavLink, useLocation, useNavigate } from "react-router";
import type { User } from "../api/types.js";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function AuthorsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function RequestsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16v11H9l-5 4z" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/**
 * Phone navigation, thumb-reachable: five tabs at the bottom. Hidden on wide screens by CSS, where the header
 * links do the job. "Recherche" is the catalog with the search box focused.
 */
export function TabBar({ user, pendingUploadCount }: { user: User; pendingUploadCount: number }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user.role === "admin";

  function focusSearch() {
    if (location.pathname === "/") {
      document.dispatchEvent(new CustomEvent("kyle-lib:focus-search"));
    } else {
      void navigate("/", { state: { focusSearch: true } });
    }
  }

  return (
    <nav className="tab-bar" aria-label="Navigation principale">
      <NavLink to="/" end className="tab">
        <HomeIcon />
        <span>Accueil</span>
      </NavLink>
      <button type="button" className="tab" onClick={focusSearch}>
        <SearchIcon />
        <span>Recherche</span>
      </button>
      <NavLink to="/authors" className="tab">
        <AuthorsIcon />
        <span>Auteurs</span>
      </NavLink>
      <NavLink to="/upload" className="tab">
        <AddIcon />
        <span>Ajouter</span>
      </NavLink>
      {isAdmin ? (
        <NavLink to="/admin" className="tab">
          <AdminIcon />
          <span>Admin</span>
          {pendingUploadCount > 0 ? (
            <span className="tab-badge" aria-label={`${pendingUploadCount} envois à valider`}>
              {pendingUploadCount}
            </span>
          ) : null}
        </NavLink>
      ) : (
        <NavLink to="/requests" className="tab">
          <RequestsIcon />
          <span>Demandes</span>
        </NavLink>
      )}
    </nav>
  );
}
