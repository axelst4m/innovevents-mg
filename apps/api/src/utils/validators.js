/**
 * Verifie le format d'une adresse email
 * @param {string} email
 * @returns {boolean}
 */
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valide la robustesse d'un mot de passe
 * @param {string} password
 * @returns {string|null} Message d'erreur ou null si valide
 */
function validatePassword(password) {
  if (!password || password.length < 8) {
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
    return "Le mot de passe doit contenir au moins un caractere special";
  }
  return null;
}

module.exports = { validateEmail, validatePassword };
