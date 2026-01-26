import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const linkClass = ({ isActive }) =>
  `nav-link minitel-link ${isActive ? "active" : ""}`;

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isEmploye, logout } = useAuth();

  // Gestion de la deconnexion
  function handleLogout() {
    logout();
    navigate("/");
  }

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

                {/* Menu conditionnel selon l'etat de connexion */}
                {!isAuthenticated ? (
                  // Utilisateur non connecte
                  <li className="nav-item">
                    <NavLink className={linkClass} to="/connexion">
                      Se connecter
                    </NavLink>
                  </li>
                ) : (
                  // Utilisateur connecte - menu dropdown
                  <li className="nav-item dropdown">
                    <button
                      className="nav-link minitel-link dropdown-toggle"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      {user?.firstname || "Mon compte"}
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      {/* Liens pour admin */}
                      {isAdmin && (
                        <>
                          <li>
                            <NavLink className="dropdown-item" to="/admin/dashboard">
                              Dashboard Admin
                            </NavLink>
                          </li>
                          <li>
                            <NavLink className="dropdown-item" to="/admin/prospects">
                              Prospects
                            </NavLink>
                          </li>
                          <li>
                            <NavLink className="dropdown-item" to="/admin/evenements">
                              Gestion Événements
                            </NavLink>
                          </li>
                          <li>
                            <NavLink className="dropdown-item" to="/admin/devis">
                              Gestion Devis
                            </NavLink>
                          </li>
                          <li>
                            <NavLink className="dropdown-item" to="/admin/messages">
                              Messages Contact
                            </NavLink>
                          </li>
                          <li>
                            <NavLink className="dropdown-item" to="/admin/avis">
                              Moderation Avis
                            </NavLink>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                        </>
                      )}

                      {/* Liens pour employe */}
                      {isEmploye && (
                        <>
                          <li>
                            <NavLink className="dropdown-item" to="/admin/avis">
                              Moderation Avis
                            </NavLink>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                        </>
                      )}

                      {/* Liens pour client */}
                      {!isAdmin && !isEmploye && (
                        <>
                          <li>
                            <NavLink className="dropdown-item" to="/espace-client">
                              Mon espace
                            </NavLink>
                          </li>
                          <li>
                            <NavLink className="dropdown-item" to="/espace-client/devis">
                              Mes devis
                            </NavLink>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                        </>
                      )}

                      {/* Commun a tous */}
                      <li>
                        <NavLink className="dropdown-item" to="/mon-profil">
                          Mon profil
                        </NavLink>
                      </li>
                      <li>
                        <button
                          className="dropdown-item text-danger"
                          onClick={handleLogout}
                        >
                          Se déconnecter
                        </button>
                      </li>
                    </ul>
                  </li>
                )}
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
