const request = require("supertest");
const app = require("../src/app");
const { createTestUser, deleteTestUser, cleanupTestUsers } = require("./helpers");

describe("Auth API", () => {
  // Nettoie les utilisateurs de test avant et apres
  beforeAll(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  // ==========================================
  // POST /api/auth/register
  // ==========================================
  describe("POST /api/auth/register", () => {
    const validUser = {
      email: "test_register@test.com",
      password: "Password123!",
      firstname: "Jean",
      lastname: "Dupont",
    };

    afterEach(async () => {
      // Nettoie l'utilisateur cree
      await cleanupTestUsers();
    });

    it("devrait creer un compte avec des donnees valides", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.message).toContain("succes");
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(validUser.email.toLowerCase());
      expect(res.body.user.role).toBe("client");
    });

    it("devrait refuser un email deja utilise", async () => {
      // Premier enregistrement
      await request(app).post("/api/auth/register").send(validUser);

      // Deuxieme tentative avec le meme email
      const res = await request(app)
        .post("/api/auth/register")
        .send(validUser);

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("deja utilise");
    });

    it("devrait refuser un email invalide", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...validUser, email: "invalid-email" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("email");
    });

    it("devrait refuser un mot de passe trop court", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...validUser, password: "Ab1!" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("8 caracteres");
    });

    it("devrait refuser un mot de passe sans majuscule", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...validUser, password: "password123!" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("majuscule");
    });

    it("devrait refuser un mot de passe sans caractere special", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...validUser, password: "Password123" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("special");
    });

    it("devrait refuser si des champs sont manquants", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "test@test.com" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("obligatoires");
    });
  });

  // ==========================================
  // POST /api/auth/login
  // ==========================================
  describe("POST /api/auth/login", () => {
    let testUser;

    beforeAll(async () => {
      testUser = await createTestUser({
        email: "test_login@test.com",
        password: "Password123!",
        firstname: "Login",
        lastname: "Test",
      });
    });

    afterAll(async () => {
      await deleteTestUser(testUser.id);
    });

    it("devrait connecter un utilisateur avec des identifiants valides", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test_login@test.com", password: "Password123!" });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("reussie");
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("test_login@test.com");
    });

    it("devrait refuser un mot de passe incorrect", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test_login@test.com", password: "WrongPassword!" });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("incorrect");
    });

    it("devrait refuser un email inconnu", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "unknown@test.com", password: "Password123!" });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("incorrect");
    });

    it("devrait refuser si email ou password manquant", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@test.com" });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("requis");
    });
  });

  // ==========================================
  // GET /api/auth/me
  // ==========================================
  describe("GET /api/auth/me", () => {
    let testUser;

    beforeAll(async () => {
      testUser = await createTestUser({
        email: "test_me@test.com",
        password: "Password123!",
      });
    });

    afterAll(async () => {
      await deleteTestUser(testUser.id);
    });

    it("devrait retourner le profil de l'utilisateur connecte", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${testUser.token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("test_me@test.com");
    });

    it("devrait refuser sans token", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
    });

    it("devrait refuser avec un token invalide", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid_token");

      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // POST /api/auth/change-password
  // ==========================================
  describe("POST /api/auth/change-password", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser({
        email: `test_changepwd_${Date.now()}@test.com`,
        password: "OldPassword123!",
      });
    });

    afterEach(async () => {
      await deleteTestUser(testUser.id);
    });

    it("devrait changer le mot de passe avec les bonnes donnees", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${testUser.token}`)
        .send({
          currentPassword: "OldPassword123!",
          newPassword: "NewPassword456!",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("succes");

      // Verifier qu'on peut se connecter avec le nouveau mot de passe
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: testUser.email, password: "NewPassword456!" });

      expect(loginRes.status).toBe(200);
    });

    it("devrait refuser si l'ancien mot de passe est incorrect", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${testUser.token}`)
        .send({
          currentPassword: "WrongPassword!",
          newPassword: "NewPassword456!",
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain("incorrect");
    });

    it("devrait refuser un nouveau mot de passe invalide", async () => {
      const res = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${testUser.token}`)
        .send({
          currentPassword: "OldPassword123!",
          newPassword: "weak",
        });

      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // POST /api/auth/forgot-password
  // ==========================================
  describe("POST /api/auth/forgot-password", () => {
    let testUser;

    beforeAll(async () => {
      testUser = await createTestUser({
        email: "test_forgot@test.com",
        password: "Password123!",
      });
    });

    afterAll(async () => {
      await deleteTestUser(testUser.id);
    });

    it("devrait toujours retourner OK (anti-enumeration)", async () => {
      // Email existant (utilisateur de test, pas le vrai admin!)
      const res1 = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "test_forgot@test.com" });

      expect(res1.status).toBe(200);

      // Email inexistant
      const res2 = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "nonexistent@test.com" });

      expect(res2.status).toBe(200);
    });

    it("devrait refuser si email manquant", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
