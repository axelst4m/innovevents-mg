import { NavLink, Outlet } from "react-router-dom";
const linkClass = ({ isActive }) =>
  `nav-link minitel-link ${isActive ? "active" : ""}`;

export default function AppLayout() {
  return (
    <div className="d-flex flex-column min-vh-100 minitel-shell">
      <header className="border-bottom minitel-header">
        <nav className="navbar navbar-expand-lg">
          <div className="container">
            <NavLink className="navbar-brand fw-bold minitel-brand" to="/">
              Innov'Events
            </NavLink>

            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#mainNav"
              aria-controls="mainNav"
              aria-expanded="false"
              aria-label="Ouvrir le menu"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="mainNav">
              <ul className="navbar-nav ms-auto gap-2 align-items-lg-center">
                <li className="nav-item">
                  <NavLink className={linkClass} to="/">
                    Accueil
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/connexion">
                    Se connecter
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/evenements">
                    Évènements
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/avis">
                    Avis
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/contact">
                    Contact
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="btn minitel-cta" to="/demande-devis">
                    Demande de devis
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/admin/prospects">
                    Admin
                  </NavLink>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-grow-1 minitel-main">
        <div className="container">
          <div className="minitel-screen">
            <Outlet />
          </div>
        </div>
      </main>

      <footer className="border-top py-3 minitel-footer">
        <div className="container d-flex justify-content-between align-items-center">
          <small className="minitel-muted">
            © {new Date().getFullYear()} Innov'Events
          </small>
          <NavLink to="/mentions-legales" className="minitel-link">
            Mentions légales
          </NavLink>
        </div>
      </footer>
    </div>
  );
}