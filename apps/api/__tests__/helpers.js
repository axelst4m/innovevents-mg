// Helpers pour les tests
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { pool } = require("../src/db/postgres");

// Doit matcher la valeur de JWT_SECRET dans .env.test
const JWT_SECRET = process.env.JWT_SECRET;

// Genere un token JWT pour les tests
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

// Cree un utilisateur de test dans la base
async function createTestUser(data = {}) {
  const email = data.email || `test_${Date.now()}@test.com`;
  const password = data.password || "Test123!";
  const firstname = data.firstname || "Test";
  const lastname = data.lastname || "User";
  const role = data.role || "client";

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, firstname, lastname, role, is_active)
     VALUES ($1, $2, $3, $4, $5, TRUE)
     RETURNING id, email, firstname, lastname, role, is_active`,
    [email.toLowerCase(), passwordHash, firstname, lastname, role]
  );

  const user = result.rows[0];
  user.token = generateToken(user);
  user.password = password;

  return user;
}

// Supprime un utilisateur de test
async function deleteTestUser(userId) {
  await pool.query("DELETE FROM users WHERE id = $1", [userId]);
}

// Nettoie les utilisateurs de test (ceux avec email contenant "test_")
async function cleanupTestUsers() {
  await pool.query("DELETE FROM users WHERE email LIKE 'test_%@test.com'");
}

module.exports = {
  generateToken,
  createTestUser,
  deleteTestUser,
  cleanupTestUsers,
  JWT_SECRET,
};
