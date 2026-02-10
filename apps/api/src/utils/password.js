const crypto = require("crypto");

/**
 * Genere un mot de passe temporaire securise
 * Utilise crypto.randomInt() au lieu de Math.random()
 * Format : 2 majuscules + 4 chiffres + 2 minuscules + 1 special
 * @returns {string}
 */
function generateTempPassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const charsLower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specials = "!@#$%&*";

  let pwd = "";
  pwd += chars[crypto.randomInt(chars.length)];
  pwd += chars[crypto.randomInt(chars.length)];
  for (let i = 0; i < 4; i++) {
    pwd += numbers[crypto.randomInt(numbers.length)];
  }
  pwd += charsLower[crypto.randomInt(charsLower.length)];
  pwd += charsLower[crypto.randomInt(charsLower.length)];
  pwd += specials[crypto.randomInt(specials.length)];
  return pwd;
}

module.exports = { generateTempPassword };
