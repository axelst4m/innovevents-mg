require("./setup");
const request = require("supertest");
const app = require("../src/app");
const { pool } = require("../src/db/postgres");
const { createTestUser, cleanupTestUsers, generateToken } = require("./helpers");

describe("Events API", () => {
  let adminUser;
  let employeeUser;
  let clientUser;
  let publicEventId;
  let draftEventId;
  let prestationId;

  // Setup des donnees de test
  beforeAll(async () => {
    await cleanupTestUsers();

    // Creation des utilisateurs de test
    adminUser = await createTestUser({
      email: "test_admin_events@test.com",
      password: "AdminPass123!",
      firstname: "Admin",
      lastname: "Events",
      role: "admin"
    });

    employeeUser = await createTestUser({
      email: "test_employe_events@test.com",
      password: "EmpPass123!",
      firstname: "Employee",
      lastname: "Events",
      role: "employe"
    });

    clientUser = await createTestUser({
      email: "test_client_events@test.com",
      password: "ClientPass123!",
      firstname: "Client",
      lastname: "Events",
      role: "client"
    });

    // Creation d'un evenement public
    const publicRes = await pool.query(
      `INSERT INTO events (
        name, description, event_type, theme,
        start_date, end_date, location, participants_count,
        status, is_public, client_approved_public, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [
        "Conference Tech 2026",
        "Une grande conference sur les technologies",
        "conference",
        "technologie",
        "2026-03-15",
        "2026-03-16",
        "Paris",
        150,
        "accepte",
        true,
        true,
        adminUser.id
      ]
    );
    publicEventId = publicRes.rows[0].id;

    // Creation d'un evenement en brouillon
    const draftRes = await pool.query(
      `INSERT INTO events (
        name, description, event_type, theme,
        start_date, end_date, location,
        status, is_public, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        "Seminaire Prive",
        "Seminaire interne non public",
        "seminaire",
        "formation",
        "2026-04-10",
        "2026-04-11",
        "Lyon",
        "brouillon",
        false,
        adminUser.id
      ]
    );
    draftEventId = draftRes.rows[0].id;

    // Ajout d'une prestation au premier evenement
    const prestRes = await pool.query(
      `INSERT INTO prestations (event_id, label, amount_ht, tva_rate)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [publicEventId, "Catering et buffet", 2500, 20]
    );
    prestationId = prestRes.rows[0].id;
  });

  afterAll(async () => {
    // Nettoyage des donnees de test
    await pool.query("DELETE FROM prestations WHERE event_id IN ($1, $2)", [publicEventId, draftEventId]);
    await pool.query("DELETE FROM events WHERE id IN ($1, $2)", [publicEventId, draftEventId]);
    await cleanupTestUsers();
  });

  // ==========================================
  // GET /api/events - Liste des evenements publics
  // ==========================================
  describe("GET /api/events", () => {
    it("devrait retourner la liste des evenements publics sans authentification", async () => {
      const res = await request(app).get("/api/events");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.events)).toBe(true);
      expect(res.body.limit).toBe(20);
      expect(res.body.offset).toBe(0);
      // L'evenement public doit etre dans la liste
      const found = res.body.events.find(e => e.id === publicEventId);
      expect(found).toBeDefined();
    });

    it("devrait respecter les parametres de pagination", async () => {
      const res = await request(app)
        .get("/api/events")
        .query({ limit: 5, offset: 0 });

      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(5);
      expect(res.body.offset).toBe(0);
    });

    it("devrait filtrer par type d'evenement", async () => {
      const res = await request(app)
        .get("/api/events")
        .query({ type: "conference" });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.events)).toBe(true);
      // Tous les resultats doivent avoir le type conference
      const allConfs = res.body.events.every(e => e.event_type === "conference");
      expect(allConfs).toBe(true);
    });

    it("devrait filtrer par theme", async () => {
      const res = await request(app)
        .get("/api/events")
        .query({ theme: "technologie" });

      expect(res.status).toBe(200);
      const found = res.body.events.find(e => e.id === publicEventId);
      expect(found).toBeDefined();
    });

    it("devrait filtrer par plage de dates", async () => {
      const res = await request(app)
        .get("/api/events")
        .query({ start_date: "2026-03-01", end_date: "2026-03-31" });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.events)).toBe(true);
      const found = res.body.events.find(e => e.id === publicEventId);
      expect(found).toBeDefined();
    });

    it("devrait exclure les evenements en brouillon de la liste publique", async () => {
      const res = await request(app).get("/api/events");

      expect(res.status).toBe(200);
      const found = res.body.events.find(e => e.id === draftEventId);
      expect(found).toBeUndefined();
    });
  });

  // ==========================================
  // GET /api/events/admin - Liste complete (admin/employe)
  // ==========================================
  describe("GET /api/events/admin", () => {
    it("devrait refuser l'acces sans authentification", async () => {
      const res = await request(app).get("/api/events/admin");

      expect(res.status).toBe(401);
    });

    it("devrait refuser l'acces pour un client", async () => {
      const res = await request(app)
        .get("/api/events/admin")
        .set("Authorization", `Bearer ${clientUser.token}`);

      expect(res.status).toBe(403);
    });

    it("devrait permettre l'acces a un admin", async () => {
      const res = await request(app)
        .get("/api/events/admin")
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.events)).toBe(true);
    });

    it("devrait permettre l'acces a un employe", async () => {
      const res = await request(app)
        .get("/api/events/admin")
        .set("Authorization", `Bearer ${employeeUser.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.events)).toBe(true);
    });

    it("devrait filtrer par statut", async () => {
      const res = await request(app)
        .get("/api/events/admin")
        .query({ status: "brouillon" })
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      const allDraft = res.body.events.every(e => e.status === "brouillon");
      expect(allDraft).toBe(true);
    });

    it("devrait inclure les evenements en brouillon", async () => {
      const res = await request(app)
        .get("/api/events/admin")
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      const found = res.body.events.find(e => e.id === draftEventId);
      expect(found).toBeDefined();
    });
  });

  // ==========================================
  // GET /api/events/:id - Detail d'un evenement
  // ==========================================
  describe("GET /api/events/:id", () => {
    it("devrait retourner un evenement public sans authentification", async () => {
      const res = await request(app).get(`/api/events/${publicEventId}`);

      expect(res.status).toBe(200);
      expect(res.body.event).toBeDefined();
      expect(res.body.event.id).toBe(publicEventId);
      expect(res.body.event.name).toBe("Conference Tech 2026");
    });

    it("devrait inclure les prestations de l'evenement", async () => {
      const res = await request(app).get(`/api/events/${publicEventId}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.event.prestations)).toBe(true);
      expect(res.body.event.prestations.length).toBeGreaterThan(0);
    });

    it("devrait refuser l'acces a un evenement en brouillon sans authentification", async () => {
      const res = await request(app).get(`/api/events/${draftEventId}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("Acces");
    });

    it("devrait permettre a un admin de voir un evenement en brouillon", async () => {
      const res = await request(app)
        .get(`/api/events/${draftEventId}`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.event.id).toBe(draftEventId);
    });

    it("devrait retourner 404 pour un evenement inexistant", async () => {
      const res = await request(app).get("/api/events/999999");

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("non trouve");
    });
  });

  // ==========================================
  // POST /api/events - Creation d'un evenement
  // ==========================================
  describe("POST /api/events", () => {
    it("devrait refuser la creation sans authentification", async () => {
      const res = await request(app)
        .post("/api/events")
        .send({
          name: "New Event",
          start_date: "2026-05-01",
          end_date: "2026-05-02",
          location: "Paris"
        });

      expect(res.status).toBe(401);
    });

    it("devrait refuser la creation pour un non-admin", async () => {
      const res = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${clientUser.token}`)
        .send({
          name: "New Event",
          start_date: "2026-05-01",
          end_date: "2026-05-02",
          location: "Paris"
        });

      expect(res.status).toBe(403);
    });

    it("devrait creer un evenement avec les donnees valides", async () => {
      const res = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          name: "Nouvelle Conference",
          description: "Description du nouvel evenement",
          event_type: "conference",
          theme: "innovation",
          start_date: "2026-05-20",
          end_date: "2026-05-21",
          location: "Bordeaux",
          participants_count: 200,
          status: "accepte",
          is_public: true
        });

      expect(res.status).toBe(201);
      expect(res.body.event).toBeDefined();
      expect(res.body.event.name).toBe("Nouvelle Conference");
      expect(res.body.event.created_by).toBe(adminUser.id);
      expect(res.body.event.status).toBe("accepte");

      // Nettoyage
      await pool.query("DELETE FROM events WHERE id = $1", [res.body.event.id]);
    });

    it("devrait refuser si des champs obligatoires manquent", async () => {
      const res = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          name: "Incomplete Event",
          start_date: "2026-05-01"
          // Manquent: end_date, location
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("obligatoires");
    });

    it("devrait utiliser 'brouillon' comme statut par defaut", async () => {
      const res = await request(app)
        .post("/api/events")
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          name: "Event Default Status",
          start_date: "2026-06-01",
          end_date: "2026-06-02",
          location: "Toulouse"
        });

      expect(res.status).toBe(201);
      expect(res.body.event.status).toBe("brouillon");

      // Nettoyage
      await pool.query("DELETE FROM events WHERE id = $1", [res.body.event.id]);
    });
  });

  // ==========================================
  // PUT /api/events/:id - Modification
  // ==========================================
  describe("PUT /api/events/:id", () => {
    let testEventId;

    beforeEach(async () => {
      // Creation d'un evenement pour les tests de modification
      const res = await pool.query(
        `INSERT INTO events (
          name, description, event_type, theme,
          start_date, end_date, location, status, is_public, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id`,
        [
          "Event a Modifier",
          "Description initiale",
          "seminaire",
          "test",
          "2026-07-01",
          "2026-07-02",
          "Paris",
          "brouillon",
          false,
          adminUser.id
        ]
      );
      testEventId = res.rows[0].id;
    });

    afterEach(async () => {
      await pool.query("DELETE FROM events WHERE id = $1", [testEventId]);
    });

    it("devrait refuser la modification sans authentification", async () => {
      const res = await request(app)
        .put(`/api/events/${testEventId}`)
        .send({ name: "Nouveau nom" });

      expect(res.status).toBe(401);
    });

    it("devrait refuser la modification pour un non-admin", async () => {
      const res = await request(app)
        .put(`/api/events/${testEventId}`)
        .set("Authorization", `Bearer ${employeeUser.token}`)
        .send({ name: "Nouveau nom" });

      expect(res.status).toBe(403);
    });

    it("devrait mettre a jour le nom de l'evenement", async () => {
      const res = await request(app)
        .put(`/api/events/${testEventId}`)
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({ name: "Evenement Renomme" });

      expect(res.status).toBe(200);
      expect(res.body.event.name).toBe("Evenement Renomme");
    });

    it("devrait changer le statut de l'evenement", async () => {
      const res = await request(app)
        .put(`/api/events/${testEventId}`)
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({ status: "accepte" });

      expect(res.status).toBe(200);
      expect(res.body.event.status).toBe("accepte");
    });

    it("devrait modifier plusieurs champs en meme temps", async () => {
      const res = await request(app)
        .put(`/api/events/${testEventId}`)
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          name: "Nom Update",
          theme: "nouvelle_theme",
          participants_count: 500,
          status: "en_cours"
        });

      expect(res.status).toBe(200);
      expect(res.body.event.name).toBe("Nom Update");
      expect(res.body.event.theme).toBe("nouvelle_theme");
      expect(res.body.event.participants_count).toBe(500);
      expect(res.body.event.status).toBe("en_cours");
    });

    it("devrait retourner 404 pour un evenement inexistant", async () => {
      const res = await request(app)
        .put("/api/events/999999")
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({ name: "Nouveau nom" });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // DELETE /api/events/:id - Suppression
  // ==========================================
  describe("DELETE /api/events/:id", () => {
    let testEventId;

    beforeEach(async () => {
      // Creation d'un evenement pour test de suppression
      const res = await pool.query(
        `INSERT INTO events (
          name, start_date, end_date, location, created_by
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        ["Event a Supprimer", "2026-08-01", "2026-08-02", "Marseille", adminUser.id]
      );
      testEventId = res.rows[0].id;
    });

    it("devrait refuser la suppression sans authentification", async () => {
      const res = await request(app).delete(`/api/events/${testEventId}`);

      expect(res.status).toBe(401);
    });

    it("devrait refuser la suppression pour un non-admin", async () => {
      const res = await request(app)
        .delete(`/api/events/${testEventId}`)
        .set("Authorization", `Bearer ${clientUser.token}`);

      expect(res.status).toBe(403);
    });

    it("devrait supprimer un evenement en tant qu'admin", async () => {
      const res = await request(app)
        .delete(`/api/events/${testEventId}`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("supprime");

      // Verifier que l'evenement est bien supprime
      const check = await pool.query("SELECT * FROM events WHERE id = $1", [testEventId]);
      expect(check.rows.length).toBe(0);
    });

    it("devrait retourner 404 pour un evenement inexistant", async () => {
      const res = await request(app)
        .delete("/api/events/999999")
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // POST /api/events/:id/prestations - Ajout prestation
  // ==========================================
  describe("POST /api/events/:id/prestations", () => {
    let testEventId;

    beforeEach(async () => {
      const res = await pool.query(
        `INSERT INTO events (name, start_date, end_date, location, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ["Event pour prestations", "2026-09-01", "2026-09-02", "Nantes", adminUser.id]
      );
      testEventId = res.rows[0].id;
    });

    afterEach(async () => {
      await pool.query("DELETE FROM prestations WHERE event_id = $1", [testEventId]);
      await pool.query("DELETE FROM events WHERE id = $1", [testEventId]);
    });

    it("devrait refuser sans authentification", async () => {
      const res = await request(app)
        .post(`/api/events/${testEventId}/prestations`)
        .send({ label: "Catering", amount_ht: 1500 });

      expect(res.status).toBe(401);
    });

    it("devrait refuser pour un non-admin", async () => {
      const res = await request(app)
        .post(`/api/events/${testEventId}/prestations`)
        .set("Authorization", `Bearer ${employeeUser.token}`)
        .send({ label: "Catering", amount_ht: 1500 });

      expect(res.status).toBe(403);
    });

    it("devrait ajouter une prestation avec donnees valides", async () => {
      const res = await request(app)
        .post(`/api/events/${testEventId}/prestations`)
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          label: "Organisation logistique",
          amount_ht: 3000,
          tva_rate: 20
        });

      expect(res.status).toBe(201);
      expect(res.body.prestation).toBeDefined();
      expect(res.body.prestation.label).toBe("Organisation logistique");
      expect(Number(res.body.prestation.amount_ht)).toBe(3000);
      expect(Number(res.body.prestation.tva_rate)).toBe(20);
      expect(res.body.prestation.event_id).toBe(testEventId);
    });

    it("devrait utiliser tva_rate 20 par defaut", async () => {
      const res = await request(app)
        .post(`/api/events/${testEventId}/prestations`)
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          label: "Decoration",
          amount_ht: 500
        });

      expect(res.status).toBe(201);
      expect(Number(res.body.prestation.tva_rate)).toBe(20);
    });

    it("devrait refuser si champs obligatoires manquent", async () => {
      const res = await request(app)
        .post(`/api/events/${testEventId}/prestations`)
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({ label: "Incomplete" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("requis");
    });

    it("devrait refuser si l'evenement n'existe pas", async () => {
      const res = await request(app)
        .post("/api/events/999999/prestations")
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({ label: "Catering", amount_ht: 1500 });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // DELETE /api/events/:eventId/prestations/:prestationId
  // ==========================================
  describe("DELETE /api/events/:eventId/prestations/:prestationId", () => {
    let testEventId;
    let testPrestationId;

    beforeEach(async () => {
      // Creation evenement et prestation
      const eventRes = await pool.query(
        `INSERT INTO events (name, start_date, end_date, location, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ["Event avec prestation", "2026-10-01", "2026-10-02", "Lille", adminUser.id]
      );
      testEventId = eventRes.rows[0].id;

      const prestRes = await pool.query(
        `INSERT INTO prestations (event_id, label, amount_ht, tva_rate)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [testEventId, "Prestation a supprimer", 2000, 20]
      );
      testPrestationId = prestRes.rows[0].id;
    });

    afterEach(async () => {
      await pool.query("DELETE FROM prestations WHERE event_id = $1", [testEventId]);
      await pool.query("DELETE FROM events WHERE id = $1", [testEventId]);
    });

    it("devrait refuser sans authentification", async () => {
      const res = await request(app)
        .delete(`/api/events/${testEventId}/prestations/${testPrestationId}`);

      expect(res.status).toBe(401);
    });

    it("devrait refuser pour un non-admin", async () => {
      const res = await request(app)
        .delete(`/api/events/${testEventId}/prestations/${testPrestationId}`)
        .set("Authorization", `Bearer ${employeeUser.token}`);

      expect(res.status).toBe(403);
    });

    it("devrait supprimer une prestation en tant qu'admin", async () => {
      const res = await request(app)
        .delete(`/api/events/${testEventId}/prestations/${testPrestationId}`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("supprimee");

      // Verifier suppression
      const check = await pool.query(
        "SELECT * FROM prestations WHERE id = $1",
        [testPrestationId]
      );
      expect(check.rows.length).toBe(0);
    });

    it("devrait retourner 404 pour une prestation inexistante", async () => {
      const res = await request(app)
        .delete(`/api/events/${testEventId}/prestations/999999`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // GET /api/events/meta/types et statuses
  // ==========================================
  describe("GET /api/events/meta/types", () => {
    it("devrait retourner la liste des types d'evenements", async () => {
      const res = await request(app).get("/api/events/meta/types");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.types)).toBe(true);
      expect(res.body.types.length).toBeGreaterThan(0);
      // Verifier qu'on a les types attendus
      const typeValues = res.body.types.map(t => t.value);
      expect(typeValues).toContain("seminaire");
      expect(typeValues).toContain("conference");
    });

    it("chaque type doit avoir value et label", async () => {
      const res = await request(app).get("/api/events/meta/types");

      expect(res.status).toBe(200);
      res.body.types.forEach(type => {
        expect(type.value).toBeDefined();
        expect(type.label).toBeDefined();
        expect(typeof type.value).toBe("string");
        expect(typeof type.label).toBe("string");
      });
    });
  });

  describe("GET /api/events/meta/statuses", () => {
    it("devrait retourner la liste des statuts", async () => {
      const res = await request(app).get("/api/events/meta/statuses");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.statuses)).toBe(true);
      expect(res.body.statuses.length).toBeGreaterThan(0);
      // Verifier qu'on a les statuts attendus
      const statusValues = res.body.statuses.map(s => s.value);
      expect(statusValues).toContain("brouillon");
      expect(statusValues).toContain("accepte");
    });

    it("chaque statut doit avoir value et label", async () => {
      const res = await request(app).get("/api/events/meta/statuses");

      expect(res.status).toBe(200);
      res.body.statuses.forEach(status => {
        expect(status.value).toBeDefined();
        expect(status.label).toBeDefined();
        expect(typeof status.value).toBe("string");
        expect(typeof status.label).toBe("string");
      });
    });
  });
});
