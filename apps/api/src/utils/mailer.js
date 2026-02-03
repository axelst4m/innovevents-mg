const nodemailer = require("nodemailer");

// Configuration du transporteur SMTP
// En dev : utiliser Mailtrap (gratuit) ou Ethereal
// En prod : remplacer par un vrai service (SendGrid, OVH, etc.)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
  port: parseInt(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || ""
  }
});

// Adresse d'expédition par défaut
const FROM_EMAIL = process.env.SMTP_FROM || "contact@innovevents.com";
const FROM_NAME = "Innov'Events";

// ============================================
// Vérifier que la config SMTP est en place
// ============================================
function isMailConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

// ============================================
// Envoyer un email (fonction générique)
// ============================================
async function sendMail({ to, subject, html, attachments }) {
  // Si pas de config SMTP, on log en console et on continue sans planter
  if (!isMailConfigured()) {
    console.log(`[MAIL] Config SMTP manquante - Email non envoyé`);
    console.log(`[MAIL] Destinataire: ${to}`);
    console.log(`[MAIL] Sujet: ${subject}`);
    return { sent: false, reason: "SMTP non configuré" };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      attachments
    });

    console.log(`[MAIL] Email envoyé à ${to} (id: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[MAIL] Erreur envoi à ${to}:`, err.message);
    return { sent: false, reason: err.message };
  }
}

// ============================================
// Email de confirmation d'inscription
// ============================================
async function sendWelcomeEmail(user) {
  return sendMail({
    to: user.email,
    subject: "Bienvenue chez Innov'Events !",
    html: `
      <h2>Bienvenue ${user.firstname} !</h2>
      <p>Votre compte a bien été créé sur la plateforme Innov'Events.</p>
      <p>Vous pouvez dès maintenant vous connecter avec votre adresse email <strong>${user.email}</strong>.</p>
      <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
      <br>
      <p>L'équipe Innov'Events</p>
    `
  });
}

// ============================================
// Email de mot de passe oublié (nouveau mdp temporaire)
// ============================================
async function sendPasswordResetEmail(user, tempPassword) {
  return sendMail({
    to: user.email,
    subject: "Votre nouveau mot de passe - Innov'Events",
    html: `
      <h2>Bonjour ${user.firstname},</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Voici votre nouveau mot de passe temporaire :</p>
      <p style="font-size: 18px; font-weight: bold; background: #f0f0f0; padding: 10px; display: inline-block;">
        ${tempPassword}
      </p>
      <p><strong>Vous devrez le modifier lors de votre prochaine connexion.</strong></p>
      <p>Si vous n'êtes pas à l'origine de cette demande, contactez-nous immédiatement.</p>
      <br>
      <p>L'équipe Innov'Events</p>
    `
  });
}

// ============================================
// Email d'envoi de devis au client
// ============================================
async function sendDevisEmail(clientEmail, clientFirstname, devisReference) {
  return sendMail({
    to: clientEmail,
    subject: `Votre devis ${devisReference} - Innov'Events`,
    html: `
      <h2>Bonjour ${clientFirstname},</h2>
      <p>Votre devis <strong>${devisReference}</strong> est prêt !</p>
      <p>Vous pouvez le consulter, le télécharger en PDF et l'accepter directement depuis votre espace client sur notre plateforme.</p>
      <p>N'hésitez pas à nous contacter si vous avez des questions.</p>
      <br>
      <p>L'équipe Innov'Events</p>
    `
  });
}

// ============================================
// Email notification acceptation devis (vers l'admin)
// ============================================
async function sendDevisAcceptedNotification(devisReference, clientName) {
  return sendMail({
    to: FROM_EMAIL,
    subject: `Devis ${devisReference} accepté par ${clientName}`,
    html: `
      <h2>Bonne nouvelle !</h2>
      <p>Le devis <strong>${devisReference}</strong> a été accepté par <strong>${clientName}</strong>.</p>
      <p>Connectez-vous à votre espace admin pour suivre la suite.</p>
    `
  });
}

module.exports = {
  sendMail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendDevisEmail,
  sendDevisAcceptedNotification
};
