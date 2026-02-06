const express = require("express");
const { pool } = require("../db/postgres");
const { roleRequired } = require("../middlewares/auth");

const router = express.Router();

// ============================================
// GET /api/dashboard/stats - Statistiques globales
// ============================================
router.get("/stats", roleRequired("admin"), async (req, res) => {
  try {
    // Statistiques des prospects
    const prospectsStats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'a_contacter') as a_contacter,
        COUNT(*) FILTER (WHERE status = 'contacte') as contacte,
        COUNT(*) FILTER (WHERE status = 'qualifie') as qualifie,
        COUNT(*) FILTER (WHERE status = 'refuse') as refuse,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as cette_semaine,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as ce_mois
      FROM prospects
    `);

    // Statistiques des clients
    const clientsStats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as ce_mois
      FROM clients
    `);

    // Statistiques des devis
    const devisStats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'brouillon') as brouillon,
        COUNT(*) FILTER (WHERE status = 'envoye') as envoye,
        COUNT(*) FILTER (WHERE status = 'accepte') as accepte,
        COUNT(*) FILTER (WHERE status = 'refuse') as refuse,
        COUNT(*) FILTER (WHERE status = 'modification') as modification,
        COALESCE(SUM(total_ttc) FILTER (WHERE status = 'accepte'), 0) as ca_accepte,
        COALESCE(SUM(total_ttc) FILTER (WHERE status = 'envoye'), 0) as ca_en_attente,
        COALESCE(SUM(total_ttc), 0) as ca_total
      FROM devis
    `);

    // Statistiques des evenements
    const eventsStats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'en_cours') as en_cours,
        COUNT(*) FILTER (WHERE status = 'termine') as termine,
        COUNT(*) FILTER (WHERE status = 'annule') as annule,
        COUNT(*) FILTER (WHERE start_date >= NOW() AND start_date <= NOW() + INTERVAL '30 days') as a_venir_30j
      FROM events
    `);

    // Derniers prospects (5)
    const derniersProspects = await pool.query(`
      SELECT id, company_name, firstname, lastname, email, event_type, status, created_at
      FROM prospects
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Derniers devis (5)
    const derniersDevis = await pool.query(`
      SELECT d.id, d.reference, d.status, d.total_ttc, d.created_at,
             c.company_name as client_company
      FROM devis d
      JOIN clients c ON d.client_id = c.id
      ORDER BY d.created_at DESC
      LIMIT 5
    `);

    // Prochains evenements (5)
    const prochainsEvents = await pool.query(`
      SELECT id, name, start_date, location, status
      FROM events
      WHERE start_date >= NOW()
      ORDER BY start_date ASC
      LIMIT 5
    `);

    // Dernières notes ajoutées sur les événements (5)
    const dernieresNotes = await pool.query(`
      SELECT n.id, n.content, n.created_at,
             u.firstname as author_firstname, u.lastname as author_lastname,
             e.name as event_name, e.id as event_id
      FROM event_notes n
      JOIN users u ON n.user_id = u.id
      JOIN events e ON n.event_id = e.id
      WHERE n.is_private = FALSE
      ORDER BY n.created_at DESC
      LIMIT 5
    `);

    res.json({
      prospects: prospectsStats.rows[0],
      clients: clientsStats.rows[0],
      devis: devisStats.rows[0],
      events: eventsStats.rows[0],
      derniers_prospects: derniersProspects.rows,
      derniers_devis: derniersDevis.rows,
      prochains_events: prochainsEvents.rows,
      dernieres_notes: dernieresNotes.rows
    });

  } catch (err) {
    console.error("Erreur GET /dashboard/stats:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
