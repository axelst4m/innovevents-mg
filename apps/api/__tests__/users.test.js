const request = require("supertest");
const app = require("../src/app");
const { createTestUser, deleteTestUser, cleanupTestUsers } = require("./helpers");

describe("Users API (Admin)", () => {
  let adminUser;
  let employeUser;
  let clientUser;

  beforeAll(async () => {
    await cleanupTestUsers();

    // Cree les utilisateurs de test
    adminUser = await createTestUser({
      email: "test_admin@test.com",
      password: "Admin123!",
      firstname: "Admin",
      lastname: "Test",
      role: "admin",
    });

    employeUser = await createTestUser({
      email: "test_employe@test.com",
      password: "Employe123!",
      firstname: "Employe",
      lastname: "Test",
      role: "employe",
    });

    clientUser = await createTestUser({
      email: "test_client@test.com",
      password: "Client123!",
      firstname: "Client",
      lastname: "Test",
      role: "client",
    });
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  // ==========================================
  // GET /api/users - Liste des utilisateurs
  // ==========================================
  describe("GET /api/users", () => {
    it("devrait lister les utilisateurs pour un admin", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it("devrait filtrer par role", async () => {
      const res = await request(app)
        .get("/api/users?role=admin")
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.users.every((u) => u.role === "admin")).toBe(true);
    });

    it("devrait filtrer par statut", async () => {
      const res = await request(app)
        .get("/api/users?status=active")
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.users.every((u) => u.is_active === true)).toBe(true);
    });

    it("devrait refuser l'acces a un employe", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${employeUser.token}`);

      expect(res.status).toBe(403);
    });

    it("devrait refuser l'acces a un client", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${clientUser.token}`);

      expect(res.status).toBe(403);
    });

    it("devrait refuser sans token", async () => {
      const res = await request(app).get("/api/users");

      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // GET /api/users/stats/count - Stats
  // ==========================================
  describe("GET /api/users/stats/count", () => {
    it("devrait retourner les stats pour un admin", async () => {
      const res = await request(app)
        .get("/api/users/stats/count")
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.total).toBeDefined();
      expect(res.body.stats.admins).toBeDefined();
      expect(res.body.stats.employes).toBeDefined();
      expect(res.body.stats.clients).toBeDefined();
    });
  });

  // ==========================================
  // POST /api/users - Creation utilisateur
  // ==========================================
  describe("POST /api/users", () => {
    let createdUserId;

    afterEach(async () => {
      if (createdUserId) {
        await deleteTestUser(createdUserId);
        createdUserId = null;
      }
    });

    it("devrait creer un utilisateur avec des donnees valides", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          email: "test_new@test.com",
          firstname: "Nouveau",
          lastname: "User",
          role: "employe",
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("test_new@test.com");
      expect(res.body.user.role).toBe("employe");
      expect(res.body.tempPassword).toBeDefined();

      createdUserId = res.body.user.id;
    });

    it("devrait refuser un email deja utilise", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          email: "test_admin@test.com", // deja utilise
          firstname: "Doublon",
          lastname: "User",
          role: "client",
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("deja utilise");
    });

    it("devrait refuser un role invalide", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          email: "test_invalid@test.com",
          firstname: "Invalid",
          lastname: "Role",
          role: "superadmin",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("invalide");
    });

    it("devrait refuser si des champs sont manquants", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({ email: "test_incomplete@test.com" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("requis");
    });

    it("devrait refuser l'acces a un non-admin", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${employeUser.token}`)
        .send({
          email: "test_unauthorized@test.com",
          firstname: "Unauthorized",
          lastname: "User",
          role: "client",
        });

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // PUT /api/users/:id - Modification
  // ==========================================
  describe("PUT /api/users/:id", () => {
    let targetUser;

    beforeAll(async () => {
      targetUser = await createTestUser({
        email: "test_target@test.com",
        password: "Target123!",
        firstname: "Target",
        lastname: "User",
        role: "client",
      });
    });

    afterAll(async () => {
      await deleteTestUser(targetUser.id);
    });

    it("devrait modifier un utilisateur", async () => {
      const res = await request(app)
        .put(`/api/users/${targetUser.id}`)
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({
          firstname: "Modified",
          lastname: "Name",
        });

      expect(res.status).toBe(200);
      expect(res.body.user.firstname).toBe("Modified");
      expect(res.body.user.lastname).toBe("Name");
    });

    it("devrait changer le role d'un utilisateur", async () => {
      const res = await request(app)
        .put(`/api/users/${targetUser.id}`)
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({ role: "employe" });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe("employe");
    });

    it("devrait empecher un admin de modifier son propre role", async () => {
      const res = await request(app)
        .put(`/api/users/${adminUser.id}`)
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({ role: "client" });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("propre role");
    });

    it("devrait retourner 404 pour un utilisateur inexistant", async () => {
      const res = await request(app)
        .put("/api/users/99999")
        .set("Authorization", `Bearer ${adminUser.token}`)
        .send({ firstname: "Test" });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // PATCH /api/users/:id/toggle-status
  // ==========================================
  describe("PATCH /api/users/:id/toggle-status", () => {
    let toggleUser;

    beforeEach(async () => {
      toggleUser = await createTestUser({
        email: `test_toggle_${Date.now()}@test.com`,
        password: "Toggle123!",
        firstname: "Toggle",
        lastname: "User",
      });
    });

    afterEach(async () => {
      await deleteTestUser(toggleUser.id);
    });

    it("devrait desactiver un utilisateur actif", async () => {
      const res = await request(app)
        .patch(`/api/users/${toggleUser.id}/toggle-status`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.is_active).toBe(false);
      expect(res.body.message).toContain("desactive");
    });

    it("devrait reactiver un utilisateur inactif", async () => {
      // D'abord desactiver
      await request(app)
        .patch(`/api/users/${toggleUser.id}/toggle-status`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      // Puis reactiver
      const res = await request(app)
        .patch(`/api/users/${toggleUser.id}/toggle-status`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.is_active).toBe(true);
      expect(res.body.message).toContain("reactive");
    });

    it("devrait empecher un admin de se desactiver lui-meme", async () => {
      const res = await request(app)
        .patch(`/api/users/${adminUser.id}/toggle-status`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("propre compte");
    });

    it("devrait bloquer la connexion d'un utilisateur desactive", async () => {
      // Desactiver
      await request(app)
        .patch(`/api/users/${toggleUser.id}/toggle-status`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      // Tenter de se connecter
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: toggleUser.email, password: "Toggle123!" });

      expect(loginRes.status).toBe(403);
      expect(loginRes.body.error).toContain("desactive");
    });

    it("devrait permettre la connexion apres reactivation", async () => {
      // Desactiver
      await request(app)
        .patch(`/api/users/${toggleUser.id}/toggle-status`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      // Verifier que la connexion est bloquee
      const blockedRes = await request(app)
        .post("/api/auth/login")
        .send({ email: toggleUser.email, password: "Toggle123!" });
      expect(blockedRes.status).toBe(403);

      // Reactiver
      await request(app)
        .patch(`/api/users/${toggleUser.id}/toggle-status`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      // Verifier que la connexion fonctionne a nouveau
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: toggleUser.email, password: "Toggle123!" });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toBeDefined();
    });

    it("devrait permettre la connexion apres reactivation (scenario client lie)", async () => {
      // Scenario complet: client existant + inscription + desactivation + reactivation
      const { pool } = require("../src/db/postgres");
      const testEmail = `test_client_linked_${Date.now()}@test.com`;

      // 1) Creer un client (simule la conversion prospect -> client)
      const clientRes = await pool.query(
        `INSERT INTO clients (company_name, firstname, lastname, email, phone, location)
         VALUES ('Test Company', 'Jean', 'Dupont', $1, '0600000000', 'Paris')
         RETURNING id`,
        [testEmail]
      );
      const clientId = clientRes.rows[0].id;

      // 2) Le client s'inscrit (lie automatiquement au client)
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({
          email: testEmail,
          password: "ClientPass123!",
          firstname: "Jean",
          lastname: "Dupont"
        });
      expect(registerRes.status).toBe(201);
      const userId = registerRes.body.user.id;

      // 3) Verifier que le client est lie au user
      const linkedClient = await pool.query(
        "SELECT user_id FROM clients WHERE id = $1",
        [clientId]
      );
      expect(linkedClient.rows[0].user_id).toBe(userId);

      // 4) Desactiver le compte via admin
      const deactivateRes = await request(app)
        .patch(`/api/users/${userId}/toggle-status`)
        .set("Authorization", `Bearer ${adminUser.token}`);
      expect(deactivateRes.status).toBe(200);
      expect(deactivateRes.body.is_active).toBe(false);

      // 5) Verifier que la connexion est bloquee
      const blockedLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: "ClientPass123!" });
      expect(blockedLogin.status).toBe(403);
      expect(blockedLogin.body.error).toContain("desactive");

      // 6) Reactiver le compte
      const reactivateRes = await request(app)
        .patch(`/api/users/${userId}/toggle-status`)
        .set("Authorization", `Bearer ${adminUser.token}`);
      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.is_active).toBe(true);

      // 7) Verifier que la connexion fonctionne a nouveau
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: "ClientPass123!" });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toBeDefined();
      expect(loginRes.body.user.email).toBe(testEmail);

      // Cleanup
      await pool.query("DELETE FROM clients WHERE id = $1", [clientId]);
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    });
  });

  // ==========================================
  // POST /api/users/:id/reset-password
  // ==========================================
  describe("POST /api/users/:id/reset-password", () => {
    let resetUser;

    beforeAll(async () => {
      resetUser = await createTestUser({
        email: "test_reset@test.com",
        password: "Reset123!",
        firstname: "Reset",
        lastname: "User",
      });
    });

    afterAll(async () => {
      await deleteTestUser(resetUser.id);
    });

    it("devrait reinitialiser le mot de passe", async () => {
      const res = await request(app)
        .post(`/api/users/${resetUser.id}/reset-password`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.tempPassword).toBeDefined();
      expect(res.body.tempPassword.length).toBeGreaterThan(0);

      // Verifier qu'on peut se connecter avec le nouveau mot de passe
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: resetUser.email, password: res.body.tempPassword });

      expect(loginRes.status).toBe(200);
    });

    it("devrait retourner 404 pour un utilisateur inexistant", async () => {
      const res = await request(app)
        .post("/api/users/99999/reset-password")
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // GET /api/users/:id - Detail
  // ==========================================
  describe("GET /api/users/:id", () => {
    it("devrait retourner le detail d'un utilisateur", async () => {
      const res = await request(app)
        .get(`/api/users/${clientUser.id}`)
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBe(clientUser.id);
      expect(res.body.user.email).toBe(clientUser.email);
    });

    it("devrait retourner 404 pour un utilisateur inexistant", async () => {
      const res = await request(app)
        .get("/api/users/99999")
        .set("Authorization", `Bearer ${adminUser.token}`);

      expect(res.status).toBe(404);
    });
  });
});
