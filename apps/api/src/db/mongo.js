const { MongoClient } = require("mongodb");

let client;
let db;

async function getMongoDb() {
  if (db) return db;

  const url = process.env.MONGO_URL;
  if (!url) throw new Error("MONGO_URL is not set");

  client = new MongoClient(url);
  await client.connect();
  db = client.db(); // prend le DB dans l'URL (innovevents)
  return db;
}

module.exports = { getMongoDb };