import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  // State du formulaire
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstname: "",
    lastname: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Gestion des changements de champs
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset erreur quand on tape
    if (error) setError("");
  }

  // Validation du mot de passe cote client
  function validatePassword(password) {
    if (password.length < 8) {
      return "Le mot de passe doit contenir au moins 8 caracteres";
    }
    if (!/[A-Z]/.test(password)) {
      return "Le mot de passe doit contenir au moins une majuscule";
    }
    if (!/[a-z]/.test(password)) {
      return "Le mot de passe doit contenir au moins une minuscule";
    }
    if (!/[0-9]/.test(password)) {
      return "Le mot de passe doit contenir au moins un chiffre";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Le mot de passe doit contenir au moins un caractere special (!@#$%^&*...)";
    }
    return null;
  }

  // Soumission du formulaire
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validations
    if (!formData.email || !formData.password || !formData.firstname || !formData.lastname) {
      setError("Tous les champs sont obligatoires");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstname: formData.firstname,
        lastname: formData.lastname
      });

      setSuccess("Compte cree avec succes ! Vous pouvez maintenant vous connecter.");

      // Redirection vers la connexion apres 2 secondes
      setTimeout(() => {
        navigate("/connexion");
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-body p-4">
              <h1 className="card-title text-center mb-4">Inscription</h1>

              {/* Message d'erreur */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {/* Message de succes */}
              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Prenom */}
                <div className="mb-3">
                  <label htmlFor="firstname" className="form-label">
                    Prenom *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="firstname"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleChange}
                    placeholder="Jean"
                    required
                  />
                </div>

                {/* Nom */}
                <div className="mb-3">
                  <label htmlFor="lastname" className="form-label">
                    Nom *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="lastname"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleChange}
                    placeholder="Dupont"
                    required
                  />
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Adresse email *
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jean.dupont@exemple.com"
                    required
                  />
                </div>

                {/* Mot de passe */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <div className="form-text">
                    8 caracteres minimum avec majuscule, minuscule, chiffre et caractere special
                  </div>
                </div>

                {/* Confirmation mot de passe */}
                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Bouton submit */}
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Inscription en cours...
                    </>
                  ) : (
                    "S'inscrire"
                  )}
                </button>
              </form>

              {/* Lien vers connexion */}
              <p className="text-center mt-3 mb-0">
                Deja un compte ?{" "}
                <Link to="/connexion">Se connecter</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
