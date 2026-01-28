// Setup global pour les tests
require("dotenv").config({ path: ".env.test" });

const { pool } = require("../src/db/postgres");

// Nettoie les connexions apres tous les tests
afterAll(async () => {
  await pool.end();
});
