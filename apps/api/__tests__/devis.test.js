require("./setup");
const request = require("supertest");
const app = require("../src/app");
const { pool } = require("../src/db/postgres");
const { createTestUser, deleteTestUser, cleanupTestUsers } = require("./helpers");

describe("Devis API", () => {
  let adminUser;
  let clientUser;
  let anotherClientUser;
  let testClientId;
  let anotherTestClientId;
  let testDevisId;
  let testLigneId;

  beforeAll(async () => {
    await cleanupTestUsers();

    // Cree les utilisateurs de test
    adminUser = await createTestUser({
      email: "test_admin_devis@test.com",
      password: "Admin123!",
      firstname: "Admin",
      lastname: "Devis",
      role: "admin",
    });

    clientUser = await createTestUser({
      email: "test_client_devis@test.com",
      password: "Client123!",
      firstname: "Client",
      lastname: "Devis",
      role: "client",
    });

    anotherClientUser = await createTestUser({
      email: "test_client2_devis@test.com",
      password: "Client123!",
      firstname: "AnotherClient",
      lastname: "Devis",
      role: "client",
    });

    // Cree les clients associes aux utilisateurs
    const clientRes = await pool.query(
      `INSERT INTO clients (user_id, firstname, lastname, company_name, email, phone, location, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id`,
      [
        clientUser.id,
        clientUser.firstname,
        clientUser.lastname,
        "Client Corp",
        clientUser.email,
        "+33612345678",
        "Paris",
      ]
    );
    testClientId = clientRes.rows[0].id;

    const anotherClientRes = await pool.query(
      `INSERT INTO clients (user_id, firstname, lastname, company_name, email, phone, location, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id`,
      [
        anotherClientUser.id,
        anotherClientUser.firstname,
        anotherClientUser.lastname,
        "Another Corp",
        anotherClientUser.email,
        "+33698765432",
        "Lyon",
      ]
    );
    anotherTestClientId = anotherClientRes.rows[0].id;

    // Cree un devis de test
    const devisRes = await pool.query(
      `INSERT INTO devis (client_id, status, created_by, created_at, updated_at)
       VALUES ($1, 'brouillon', $2, NOW(), NOW())
       RETURNING id`,
      [testClientId, adminUser.id]
    );
    testDevisId = devisRes.rows[0].id;

    // Cree une ligne de devis de test
    const ligneRes = await pool.query(
      `INSERT INTO lignes_devis (devis_id, label, description, quantity, unit_price_ht, tva_rate, total_ht, total_tva, total_ttc, sort_order, created_at)
       VALUES ($1, 'Service 1', 'Description test', 1, 100.00, 20, 100.00, 20.00, 120.00, 0, NOW())
       RETURNING id`,
      [testDevisId]
    );
    testLigneId = ligneRes.rows[0].id;
  });

  afterAll(async () => {
    // Nettoie les donnees creees
    await pool.query("DELETE FROM lignes_devis WHERE devis_id IN (SELECT id FROM devis WHERE created_by = $1)", [adminUser.id]);
    await pool.query("DELETE FROM devis WHERE created_by = $1", [adminUser.id]);
    await pool.query("DELETE FROM clients WHERE user_id IN ($1, $2, $3)", [clientUser.id, anotherClientUser.id, adminUser.id]);
    await cleanupTestUsers();
  });

  // ==========================================
  // GET /api/devis - Liste de tous les devis (admin)
  // ==========================================
  describe("GET /api/devis", () => {
    it("devrait lister les devis pour un admin", async () => {
      const res = await request(app)
        .get("/api/devis")
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.devis).toBeDefined();
      expect(Array.isArray(res.body.devis)).toBe(true);
      expect(res.body.count).toBeDefined();
    });

    it("devrait filtrer les devis par statut", async () => {
      const res = await request(app)
        .get("/api/devis?status=brouillon")
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.devis)).toBe(true);
      // Tous les devis retournes devraient avoir le statut 'brouillon'
      res.body.devis.forEach((d) => {
        expect(d.status).toBe("brouillon");
      });
    });

    it("devrait filtrer les devis par client_id", async () => {
      const res = await request(app)
        .get(`/api/devis?client_id=${testClientId}`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.devis)).toBe(true);
      res.body.devis.forEach((d) => {
        expect(d.client_id).toBe(testClientId);
      });
    });

    it("devrait gerer la pagination avec limit et offset", async () => {
      const res = await request(app)
        .get("/api/devis?limit=10&offset=0")
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.devis.length).toBeLessThanOrEqual(10);
    });

    it("devrait refuser l'acces pour un client", async () => {
      const res = await request(app)
        .get("/api/devis")
        .set("Authorization", `Bearer ${clientUser.token}`);

      expect(res.status).toBe(403);
    });

    it("devrait refuser sans token", async () => {
      const res = await request(app).get("/api/devis");

      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // GET /api/devis/client - Devis du client
  // ==========================================
  describe("GET /api/devis/client", () => {
    it("devrait retourner les devis du client connecte", async () => {
      const res = await request(app)
        .get("/api/devis/client")
        .set("Authorization", `Bearer ${clientUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.devis).toBeDefined();
      expect(Array.isArray(res.body.devis)).toBe(true);
      // Tous les devis retournes devraient appartenir au client connecte
      res.body.devis.forEach((d) => {
        expect(d.client_id).toBe(testClientId);
      });
    });

    it("devrait retourner un tableau vide pour un client sans devis", async () => {
      // Creer un nouveau client sans devis
      const newClient = await createTestUser({
        email: `test_noclient_${Date.now()}@test.com`,
        password: "Client123!",
        role: "client",
      });

      const res = await request(app)
        .get("/api/devis/client")
        .set("Authorization", `Bearer ${newClient.token}`);

      expect(res.status).toBe(200);
      expect(res.body.devis).toEqual([]);

      // Nettoie
      await deleteTestUser(newClient.id);
    });

    it("devrait refuser sans token", async () => {
      const res = await request(app).get("/api/devis/client");

      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // POST /api/devis - Creer un devis (admin)
  // ==========================================
  describe("POST /api/devis", () => {
    it("devrait creer un devis avec les donnees valides", async () => {
      const res = await request(app)
        .post("/api/devis")
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          client_id: testClientId,
          valid_until: "2026-03-15",
          custom_message: "Message personnalise",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain("succes");
      expect(res.body.devis).toBeDefined();
      expect(res.body.devis.client_id).toBe(testClientId);
      expect(res.body.devis.status).toBe("brouillon");
    });

    it("devrait creer un devis avec des lignes", async () => {
      const res = await request(app)
        .post("/api/devis")
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          client_id: testClientId,
          lignes: [
            {
              label: "Service A",
              description: "Description A",
              quantity: 2,
              unit_price_ht: 150.00,
              tva_rate: 20,
            },
            {
              label: "Service B",
              quantity: 1,
              unit_price_ht: 300.00,
              tva_rate: 5.5,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.devis).toBeDefined();

      // Verifier que les lignes ont ete creees
      const lignesRes = await pool.query(
        "SELECT * FROM lignes_devis WHERE devis_id = $1 ORDER BY sort_order",
        [res.body.devis.id]
      );
      expect(lignesRes.rows.length).toBe(2);

      // Verifier les calculs TVA
      const ligne1 = lignesRes.rows[0];
      expect(ligne1.quantity).toBe(2);
      expect(ligne1.unit_price_ht).toBe(150);
      expect(ligne1.total_ht).toBe(300); // 2 * 150
      expect(ligne1.total_tva).toBe(60); // 300 * 0.20
      expect(ligne1.total_ttc).toBe(360); // 300 + 60
    });

    it("devrait refuser sans client_id", async () => {
      const res = await request(app)
        .post("/api/devis")
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          valid_until: "2026-03-15",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("client_id");
    });

    it("devrait refuser l'acces pour un client", async () => {
      const res = await request(app)
        .post("/api/devis")
        .set("Authorization", `Bearer ${clientUser.token}`)
        .send({
          client_id: testClientId,
        });

      expect(res.status).toBe(403);
    });

    it("devrait refuser sans token", async () => {
      const res = await request(app).post("/api/devis").send({
        client_id: testClientId,
      });

      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // GET /api/devis/:id - Detail d'un devis
  // ==========================================
  describe("GET /api/devis/:id", () => {
    it("devrait retourner les details d'un devis pour le client proprietaire", async () => {
      const res = await request(app)
        .get(`/api/devis/${testDevisId}`)
        .set("Authorization", `Bearer ${clientUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.devis).toBeDefined();
      expect(res.body.devis.id).toBe(testDevisId);
      expect(res.body.devis.lignes).toBeDefined();
      expect(Array.isArray(res.body.devis.lignes)).toBe(true);
    });

    it("devrait retourner les details pour un admin", async () => {
      const res = await request(app)
        .get(`/api/devis/${testDevisId}`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.devis).toBeDefined();
      expect(res.body.devis.id).toBe(testDevisId);
    });

    it("devrait refuser l'acces pour un autre client", async () => {
      const res = await request(app)
        .get(`/api/devis/${testDevisId}`)
        .set("Authorization", `Bearer ${anotherClientUser.token}`);

      expect(res.status).toBe(403);
    });

    it("devrait retourner 404 pour un devis inexistant", async () => {
      const res = await request(app)
        .get("/api/devis/99999")
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(404);
    });

    it("devrait refuser sans token", async () => {
      const res = await request(app).get(`/api/devis/${testDevisId}`);

      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // POST /api/devis/:id/lignes - Ajouter une ligne
  // ==========================================
  describe("POST /api/devis/:id/lignes", () => {
    it("devrait ajouter une ligne au devis", async () => {
      const res = await request(app)
        .post(`/api/devis/${testDevisId}/lignes`)
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          label: "Service additionnel",
          description: "Description supplementaire",
          quantity: 3,
          unit_price_ht: 50.00,
          tva_rate: 20,
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain("ajoutee");
      expect(res.body.ligne).toBeDefined();
      expect(res.body.ligne.label).toBe("Service additionnel");
      expect(res.body.ligne.quantity).toBe(3);
      expect(res.body.ligne.unit_price_ht).toBe(50);
    });

    it("devrait calculer correctement la TVA", async () => {
      const res = await request(app)
        .post(`/api/devis/${testDevisId}/lignes`)
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          label: "Test TVA",
          quantity: 2,
          unit_price_ht: 100.00,
          tva_rate: 5.5,
        });

      expect(res.status).toBe(201);
      const ligne = res.body.ligne;
      expect(ligne.total_ht).toBe(200); // 2 * 100
      expect(ligne.total_tva).toBe(11); // 200 * 0.055
      expect(ligne.total_ttc).toBe(211); // 200 + 11
    });

    it("devrait refuser sans label", async () => {
      const res = await request(app)
        .post(`/api/devis/${testDevisId}/lignes`)
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          quantity: 1,
          unit_price_ht: 100.00,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("label");
    });

    it("devrait refuser sans unit_price_ht", async () => {
      const res = await request(app)
        .post(`/api/devis/${testDevisId}/lignes`)
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          label: "Service",
          quantity: 1,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("unit_price_ht");
    });

    it("devrait retourner 404 pour un devis inexistant", async () => {
      const res = await request(app)
        .post("/api/devis/99999/lignes")
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          label: "Service",
          unit_price_ht: 100.00,
        });

      expect(res.status).toBe(404);
    });

    it("devrait refuser l'acces pour un client", async () => {
      const res = await request(app)
        .post(`/api/devis/${testDevisId}/lignes`)
        .set("Authorization", `Bearer ${clientUser.token}`)
        .send({
          label: "Service",
          unit_price_ht: 100.00,
        });

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // DELETE /api/devis/:devisId/lignes/:ligneId
  // ==========================================
  describe("DELETE /api/devis/:devisId/lignes/:ligneId", () => {
    let tempLigneId;

    beforeEach(async () => {
      // Cree une ligne temporaire pour chaque test
      const res = await pool.query(
        `INSERT INTO lignes_devis (devis_id, label, quantity, unit_price_ht, tva_rate, total_ht, total_tva, total_ttc, sort_order, created_at)
         VALUES ($1, 'Temp Ligne', 1, 100.00, 20, 100.00, 20.00, 120.00, 99, NOW())
         RETURNING id`,
        [testDevisId]
      );
      tempLigneId = res.rows[0].id;
    });

    it("devrait supprimer une ligne du devis", async () => {
      const res = await request(app)
        .delete(`/api/devis/${testDevisId}/lignes/${tempLigneId}`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("supprimee");

      // Verifier que la ligne a ete supprimee
      const checkRes = await pool.query(
        "SELECT * FROM lignes_devis WHERE id = $1",
        [tempLigneId]
      );
      expect(checkRes.rows.length).toBe(0);
    });

    it("devrait retourner 404 pour une ligne inexistante", async () => {
      const res = await request(app)
        .delete(`/api/devis/${testDevisId}/lignes/99999`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(404);
    });

    it("devrait refuser l'acces pour un client", async () => {
      const res = await request(app)
        .delete(`/api/devis/${testDevisId}/lignes/${tempLigneId}`)
        .set("Authorization", `Bearer ${clientUser.token}`);

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // PUT /api/devis/:id - Modifier un devis
  // ==========================================
  describe("PUT /api/devis/:id", () => {
    it("devrait modifier le statut d'un devis", async () => {
      const res = await request(app)
        .put(`/api/devis/${testDevisId}`)
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          status: "envoye",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("mis a jour");
      expect(res.body.devis.status).toBe("envoye");
    });

    it("devrait modifier les donnees d'un devis", async () => {
      const newMessage = "Nouveau message personnalise";
      const res = await request(app)
        .put(`/api/devis/${testDevisId}`)
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          custom_message: newMessage,
          valid_until: "2026-04-30",
        });

      expect(res.status).toBe(200);
      expect(res.body.devis.custom_message).toBe(newMessage);
    });

    it("devrait retourner 404 pour un devis inexistant", async () => {
      const res = await request(app)
        .put("/api/devis/99999")
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          status: "envoye",
        });

      expect(res.status).toBe(404);
    });

    it("devrait refuser l'acces pour un client", async () => {
      const res = await request(app)
        .put(`/api/devis/${testDevisId}`)
        .set("Authorization", `Bearer ${clientUser.token}`)
        .send({
          status: "accepte",
        });

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // POST /api/devis/:id/accept - Accepter le devis
  // ==========================================
  describe("POST /api/devis/:id/accept", () => {
    beforeEach(async () => {
      // Remet le devis en statut 'envoye' ou 'en_etude' avant chaque test
      await pool.query(
        "UPDATE devis SET status = $1 WHERE id = $2",
        ["envoye", testDevisId]
      );
    });

    it("devrait accepter un devis en tant que client proprietaire", async () => {
      const res = await request(app)
        .post(`/api/devis/${testDevisId}/accept`)
        .set("Authorization", `Bearer ${clientUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("accepte");

      // Verifier que le statut a ete change
      const checkRes = await pool.query(
        "SELECT status FROM devis WHERE id = $1",
        [testDevisId]
      );
      expect(checkRes.rows[0].status).toBe("accepte");
    });

    it("devrait accepter un devis en tant qu'admin", async () => {
      const res = await request(app)
        .post(`/api/devis/${testDevisId}/accept`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("accepte");
    });

    it("devrait refuser si le client n'en est pas le proprietaire", async () => {
      const res = await request(app)
        .post(`/api/devis/${testDevisId}/accept`)
        .set("Authorization", `Bearer ${anotherClientUser.token}`);

      expect(res.status).toBe(403);
    });

    it("devrait refuser si le devis n'est pas en statut valide", async () => {
      // Met le devis en statut 'brouillon'
      await pool.query(
        "UPDATE devis SET status = $1 WHERE id = $2",
        ["brouillon", testDevisId]
      );

      const res = await request(app)
        .post(`/api/devis/${testDevisId}/accept`)
        .set("Authorization", `Bearer ${clientUser.token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("ne peut pas");
    });

    it("devrait refuser sans token", async () => {
      const res = await request(app).post(`/api/devis/${testDevisId}/accept`);

      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // POST /api/devis/:id/refuse - Refuser le devis
  // ==========================================
  describe("POST /api/devis/:id/refuse", () => {
    beforeEach(async () => {
      // Remet le devis en statut 'envoye' ou 'en_etude'
      await pool.query(
        "UPDATE devis SET status = $1 WHERE id = $2",
        ["envoye", testDevisId]
      );
    });

    it("devrait refuser un devis en tant que client proprietaire", async () => {
      const res = await request(app)
        .post(`/api/devis/${testDevisId}/refuse`)
        .set("Authorization", `Bearer ${clientUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("refuse");

      // Verifier que le statut a ete change
      const checkRes = await pool.query(
        "SELECT status FROM devis WHERE id = $1",
        [testDevisId]
      );
      expect(checkRes.rows[0].status).toBe("refuse");
    });

    it("devrait refuser un devis en tant qu'admin", async () => {
      const res = await request(app)
        .post(`/api/devis/${testDevisId}/refuse`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("refuse");
    });

    it("devrait refuser si le client n'en est pas le proprietaire", async () => {
      const res = await request(app)
        .post(`/api/devis/${testDevisId}/refuse`)
        .set("Authorization", `Bearer ${anotherClientUser.token}`);

      expect(res.status).toBe(403);
    });

    it("devrait refuser si le devis n'est pas en statut valide", async () => {
      // Met le devis en statut 'brouillon'
      await pool.query(
        "UPDATE devis SET status = $1 WHERE id = $2",
        ["brouillon", testDevisId]
      );

      const res = await request(app)
        .post(`/api/devis/${testDevisId}/refuse`)
        .set("Authorization", `Bearer ${clientUser.token}`);

      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // POST /api/devis/:id/request-modification
  // ==========================================
  describe("POST /api/devis/:id/request-modification", () => {
    beforeEach(async () => {
      // Remet le devis en statut 'envoye'
      await pool.query(
        "UPDATE devis SET status = $1 WHERE id = $2",
        ["envoye", testDevisId]
      );
    });

    it("devrait demander une modification avec un motif valide", async () => {
      const reason = "Le prix est trop eleve, merci de revoir a la baisse";
      const res = await request(app)
        .post(`/api/devis/${testDevisId}/request-modification`)
        .set("Authorization", `Bearer ${clientUser.token}`)
        .send({ reason });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("demande");

      // Verifier que le statut et la raison ont ete enregistres
      const checkRes = await pool.query(
        "SELECT status, modification_reason FROM devis WHERE id = $1",
        [testDevisId]
      );
      expect(checkRes.rows[0].status).toBe("modification");
      expect(checkRes.rows[0].modification_reason).toBe(reason);
    });

    it("devrait refuser sans motif", async () => {
      const res = await request(app)
        .post(`/api/devis/${testDevisId}/request-modification`)
        .set("Authorization", `Bearer ${clientUser.token}`)
        .send({ reason: "" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("requis");
    });

    it("devrait refuser avec un motif null", async () => {
      const res = await request(app)
        .post(`/api/devis/${testDevisId}/request-modification`)
        .set("Authorization", `Bearer ${clientUser.token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("requis");
    });

    it("devrait refuser si le client n'en est pas le proprietaire", async () => {
      const res = await request(app)
        .post(`/api/devis/${testDevisId}/request-modification`)
        .set("Authorization", `Bearer ${anotherClientUser.token}`)
        .send({ reason: "Test" });

      expect(res.status).toBe(403);
    });

    it("devrait refuser sans token", async () => {
      const res = await request(app)
        .post(`/api/devis/${testDevisId}/request-modification`)
        .send({ reason: "Test" });

      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // GET /api/devis/:id/pdf - Telecharger le PDF
  // ==========================================
  describe("GET /api/devis/:id/pdf", () => {
    it("devrait generer un PDF pour le client proprietaire", async () => {
      const res = await request(app)
        .get(`/api/devis/${testDevisId}/pdf`)
        .set("Authorization", `Bearer ${clientUser.token}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/application\/pdf/);
      expect(res.headers["content-disposition"]).toMatch(/attachment/);
    });

    it("devrait generer un PDF pour un admin", async () => {
      const res = await request(app)
        .get(`/api/devis/${testDevisId}/pdf`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/application\/pdf/);
    });

    it("devrait refuser pour un autre client", async () => {
      const res = await request(app)
        .get(`/api/devis/${testDevisId}/pdf`)
        .set("Authorization", `Bearer ${anotherClientUser.token}`);

      expect(res.status).toBe(403);
    });

    it("devrait retourner 404 pour un devis inexistant", async () => {
      const res = await request(app)
        .get("/api/devis/99999/pdf")
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(404);
    });

    it("devrait refuser sans token", async () => {
      const res = await request(app).get(`/api/devis/${testDevisId}/pdf`);

      expect(res.status).toBe(401);
    });
  });
});
