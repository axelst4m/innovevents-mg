const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AuthModel = require("../models/AuthModel");
const { logAction } = require("../utils/logger");
const { validateEmail, validatePassword } = require("../utils/validators");
const { generateTempPassword } = require("../utils/password");
const { sendWelcomeEmail, sendPasswordResetEmail } = require("../utils/mailer");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET manquant dans les variables d'environnement");
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "24h";

/**
 * AuthService - Logique metier pour l'authentification.
 */
class AuthService {

  static async register(data) {
    const { email, password, firstname, lastname } = data;

    if (!email || !password || !firstname || !lastname) {
      const error = new Error("Tous les champs sont obligatoires (email, password, firstname, lastname)");
      error.status = 400;
      throw error;
    }

    if (!validateEmail(email)) {
      const error = new Error("Format d'email invalide");
      error.status = 400;
      throw error;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      const error = new Error(passwordError);
      error.status = 400;
      throw error;
    }

    const exists = await AuthModel.emailExists(email);
    if (exists) {
      const error = new Error("Cet email est deja utilise");
      error.status = 409;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await AuthModel.createUser({
      email: email.toLowerCase(),
      passwordHash,
      firstname,
      lastname
    });

    // Lier un client existant si meme email
    let linkedClient = null;
    const client = await AuthModel.findClientByEmail(email);
    if (client) {
      await AuthModel.linkClientToUser(user.id, client.id);
      linkedClient = client;
    }

    await logAction({
      type_action: "CREATION_COMPTE",
      userId: user.id,
      details: { email: user.email, role: user.role, linked_client_id: linkedClient?.id || null }
    });

    sendWelcomeEmail(user).catch(err =>
      console.error("Erreur envoi email bienvenue:", err.message)
    );

    return { user, linkedClient };
  }

  static async login(data, clientIp) {
    const { email, password } = data;

    if (!email || !password) {
      const error = new Error("Email et mot de passe requis");
      error.status = 400;
      throw error;
    }

    const user = await AuthModel.findByEmail(email);

    if (!user) {
      await logAction({
        type_action: "CONNEXION_ECHOUEE",
        userId: null,
        details: { email: email.toLowerCase(), ip: clientIp, raison: "Email inconnu" }
      });
      const error = new Error("Email ou mot de passe incorrect");
      error.status = 401;
      throw error;
    }

    if (!user.is_active) {
      await logAction({
        type_action: "CONNEXION_ECHOUEE",
        userId: user.id,
        details: { email: user.email, ip: clientIp, raison: "Compte desactive" }
      });
      const error = new Error("Compte desactive. Contactez l'administrateur.");
      error.status = 403;
      throw error;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      await logAction({
        type_action: "CONNEXION_ECHOUEE",
        userId: user.id,
        details: { email: user.email, ip: clientIp, raison: "Mot de passe incorrect" }
      });
      const error = new Error("Email ou mot de passe incorrect");
      error.status = 401;
      throw error;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await logAction({ type_action: "CONNEXION_REUSSIE", userId: user.id, details: { ip: clientIp } });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        mustChangePassword: user.must_change_password
      }
    };
  }

  static async forgotPassword(email) {
    if (!email) {
      const error = new Error("Email requis");
      error.status = 400;
      throw error;
    }

    const user = await AuthModel.findActiveByEmail(email);

    // Toujours repondre OK pour eviter l'enumeration
    if (!user) return { message: "Si cet email existe, un nouveau mot de passe a ete envoye" };

    const tempPassword = generateTempPassword();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    await AuthModel.updatePassword(user.id, passwordHash, true);

    await logAction({ type_action: "MOT_DE_PASSE_REINITIALISE", userId: user.id, details: { email: user.email } });

    sendPasswordResetEmail(user, tempPassword).catch(err =>
      console.error("Erreur envoi email reset:", err.message)
    );
    console.log(`[DEV] Nouveau mot de passe pour ${user.email}: ${tempPassword}`);

    return { message: "Si cet email existe, un nouveau mot de passe a ete envoye" };
  }

  static async changePassword(userId, data) {
    const { currentPassword, newPassword } = data;

    if (!currentPassword || !newPassword) {
      const error = new Error("Mot de passe actuel et nouveau mot de passe requis");
      error.status = 400;
      throw error;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      const error = new Error(passwordError);
      error.status = 400;
      throw error;
    }

    const user = await AuthModel.findPasswordHash(userId);
    if (!user) {
      const error = new Error("Utilisateur non trouve");
      error.status = 404;
      throw error;
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      const error = new Error("Mot de passe actuel incorrect");
      error.status = 401;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await AuthModel.updatePassword(userId, passwordHash, false);

    await logAction({ type_action: "CHANGEMENT_MOT_DE_PASSE", userId, details: {} });

    return { message: "Mot de passe modifie avec succes" };
  }

  static async getProfile(userId) {
    const user = await AuthModel.findById(userId);
    if (!user) {
      const error = new Error("Utilisateur non trouve");
      error.status = 404;
      throw error;
    }
    return user;
  }

  static async listUsers(query = {}) {
    return AuthModel.findActiveUsers(query);
  }

  static async deleteAccount(userId, password) {
    if (!password) {
      const error = new Error("Mot de passe requis");
      error.status = 400;
      throw error;
    }

    const user = await AuthModel.findPasswordHash(userId);
    if (!user) {
      const error = new Error("Utilisateur non trouve");
      error.status = 404;
      throw error;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      const error = new Error("Mot de passe incorrect");
      error.status = 401;
      throw error;
    }

    // Anonymiser l'utilisateur
    const anonymizedEmail = await AuthModel.anonymizeUser(userId);

    // Anonymiser les clients lies
    const clients = await AuthModel.findClientsByUserId(userId);
    for (const client of clients) {
      await AuthModel.anonymizeClient(client.id, anonymizedEmail);
      await AuthModel.anonymizeClientDevis(client.id);
      await AuthModel.anonymizeClientReviews(client.id);
    }

    await logAction({
      type_action: "SUPPRESSION_COMPTE",
      userId,
      details: { email: anonymizedEmail, clients_anonymises: clients.length }
    });

    return true;
  }

  /**
   * Verifier un token JWT et retourner le payload decode.
   */
  static verifyToken(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const error = new Error("Token requis");
      error.status = 401;
      throw error;
    }

    const token = authHeader.split(" ")[1];

    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      const error = new Error("Token invalide ou expire");
      error.status = 401;
      throw error;
    }
  }
}

module.exports = AuthService;
