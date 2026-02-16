// Setup global pour les tests
require("dotenv").config({ path: ".env.test" });

const { pool } = require("../src/db/postgres");
const { closeMongoClient } = require("../src/db/mongo");

// Nettoie les connexions apres tous les tests
afterAll(async () => {
  await closeMongoClient();
  await pool.end();
});
