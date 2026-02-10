const { getMongoDb } = require("../db/mongo");

/**
 * Log une action dans MongoDB (collection "logs")
 * @param {Object} params
 * @param {string} params.type_action - Type de l'action (ex: "CREATION_UTILISATEUR_ADMIN")
 * @param {number} params.userId - ID de l'utilisateur qui effectue l'action
 * @param {Object|string} params.details - Details complementaires
 */
async function logAction({ type_action, userId, details }) {
  try {
    const db = await getMongoDb();
    await db.collection("logs").insertOne({
      horodatage: new Date(),
      type_action,
      id_utilisateur: userId,
      details
    });
  } catch (err) {
    // On ne throw pas : le logging ne doit jamais bloquer la logique metier
    console.error("Erreur log MongoDB:", err.message);
  }
}

module.exports = { logAction };
