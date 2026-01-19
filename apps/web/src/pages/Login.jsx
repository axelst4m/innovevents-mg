import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, forgotPassword } = useAuth();

  // State du formulaire
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // State pour le mode "mot de passe oublie"
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");

  // Ou rediriger apres connexion
  const from = location.state?.from?.pathname || "/";

  // Soumission du formulaire de connexion
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email et mot de passe requis");
      return;
    }

    setLoading(true);

    try {
      const data = await login(email, password);

      // Si l'utilisateur doit changer son mot de passe
      if (data.user.mustChangePassword) {
        navigate("/changer-mot-de-passe", { state: { mustChange: true } });
        return;
      }

      // Redirection selon le role
      if (data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (data.user.role === "employe") {
        navigate("/employe/dashboard");
      } else {
        // Client - rediriger vers la page demandee ou l'espace client
        navigate(from !== "/" ? from : "/espace-client");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Soumission mot de passe oublie
  async function handleForgotPassword(e) {
    e.preventDefault();
    setError("");
    setForgotMessage("");

    if (!forgotEmail) {
      setError("Veuillez entrer votre email");
      return;
    }

    setLoading(true);

    try {
      await forgotPassword(forgotEmail);
      setForgotMessage("Si cet email existe, un nouveau mot de passe vous a ete envoye.");
      setForgotEmail("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Affichage du formulaire mot de passe oublie
  if (forgotMode) {
    return (
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow">
              <div className="card-body p-4">
                <h1 className="card-title text-center mb-4">Mot de passe oublie</h1>

                <p className="text-muted text-center mb-4">
                  Entrez votre adresse email. Si un compte existe, vous recevrez un nouveau mot de passe.
                </p>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {forgotMessage && (
                  <div className="alert alert-success" role="alert">
                    {forgotMessage}
                  </div>
                )}

                <form onSubmit={handleForgotPassword}>
                  <div className="mb-4">
                    <label htmlFor="forgotEmail" className="form-label">
                      Adresse email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="forgotEmail"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="jean.dupont@exemple.com"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Envoi en cours...
                      </>
                    ) : (
                      "Envoyer"
                    )}
                  </button>
                </form>

                <p className="text-center mt-3 mb-0">
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={() => {
                      setForgotMode(false);
                      setError("");
                      setForgotMessage("");
                    }}
                  >
                    Retour a la connexion
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulaire de connexion normal
  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-body p-4">
              <h1 className="card-title text-center mb-4">Connexion</h1>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="jean.dupont@exemple.com"
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Mot de passe */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    required
                    autoComplete="current-password"
                  />
                </div>

                {/* Lien mot de passe oublie */}
                <div className="mb-4 text-end">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={() => {
                      setForgotMode(true);
                      setError("");
                    }}
                  >
                    Mot de passe oublie ?
                  </button>
                </div>

                {/* Bouton connexion */}
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Connexion en cours...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </button>
              </form>

              {/* Lien vers inscription */}
              <p className="text-center mt-3 mb-0">
                Pas encore de compte ?{" "}
                <Link to="/inscription">S'inscrire</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
