const PDFDocument = require("pdfkit");

// ============================================
// Generateur PDF pour les devis
// ============================================

function generateDevisPDF(devis) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // === EN-TETE ===
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("INNOV'EVENTS", 50, 50)
        .fontSize(10)
        .font("Helvetica")
        .text("Agence evenementielle de zinz", 50, 80)
        .text("12 cours Lieutaud, 13006 Marseille", 50, 95)
        .text("axel@innovevents.com | 06 23 45 67 89", 50, 110);

      // === REFERENCE DEVIS ===
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("DEVIS", 400, 50, { align: "right" })
        .fontSize(12)
        .font("Helvetica")
        .text(`Ref: ${devis.reference}`, 400, 80, { align: "right" })
        .text(`Date: ${formatDate(devis.created_at)}`, 400, 95, { align: "right" });

      if (devis.valid_until) {
        doc.text(`Valide jusqu'au: ${formatDate(devis.valid_until)}`, 400, 110, { align: "right" });
      }

      // Ligne de separation
      doc
        .moveTo(50, 140)
        .lineTo(550, 140)
        .stroke();

      // === INFORMATIONS CLIENT ===
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Client:", 50, 160)
        .font("Helvetica")
        .text(devis.client_company || "", 50, 178)
        .text(`${devis.client_firstname} ${devis.client_lastname}`, 50, 193)
        .text(devis.client_location || "", 50, 208)
        .text(devis.client_email || "", 50, 223)
        .text(devis.client_phone || "", 50, 238);

      // === INFORMATIONS EVENEMENT ===
      if (devis.event_name) {
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text("Evenement:", 300, 160)
          .font("Helvetica")
          .text(devis.event_name, 300, 178)
          .text(devis.event_location || "", 300, 193);

        if (devis.event_start_date) {
          doc.text(`Date: ${formatDate(devis.event_start_date)}`, 300, 208);
        }
      }

      // === TABLEAU DES PRESTATIONS ===
      let tableTop = 280;

      // En-tete du tableau
      doc
        .rect(50, tableTop, 500, 25)
        .fill("#f0f0f0")
        .stroke();

      doc
        .fillColor("#000000")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Description", 55, tableTop + 8)
        .text("Qte", 300, tableTop + 8, { width: 40, align: "center" })
        .text("Prix HT", 350, tableTop + 8, { width: 60, align: "right" })
        .text("TVA", 420, tableTop + 8, { width: 40, align: "right" })
        .text("Total TTC", 470, tableTop + 8, { width: 75, align: "right" });

      tableTop += 25;

      // Lignes du devis
      doc.font("Helvetica").fontSize(10);

      if (devis.lignes && devis.lignes.length > 0) {
        devis.lignes.forEach((ligne, index) => {
          const rowHeight = 25;
          const y = tableTop + index * rowHeight;

          // Alternance de couleurs
          if (index % 2 === 0) {
            doc.rect(50, y, 500, rowHeight).fill("#fafafa").stroke();
            doc.fillColor("#000000");
          }

          doc
            .text(ligne.label, 55, y + 8, { width: 240 })
            .text(ligne.quantity.toString(), 300, y + 8, { width: 40, align: "center" })
            .text(formatMoney(ligne.unit_price_ht), 350, y + 8, { width: 60, align: "right" })
            .text(`${ligne.tva_rate}%`, 420, y + 8, { width: 40, align: "right" })
            .text(formatMoney(ligne.total_ttc), 470, y + 8, { width: 75, align: "right" });
        });

        tableTop += devis.lignes.length * 25;
      }

      // === TOTAUX ===
      tableTop += 20;

      doc
        .font("Helvetica")
        .fontSize(11)
        .text("Total HT:", 380, tableTop, { width: 80, align: "right" })
        .text(formatMoney(devis.total_ht), 470, tableTop, { width: 75, align: "right" });

      tableTop += 18;
      doc
        .text("Total TVA:", 380, tableTop, { width: 80, align: "right" })
        .text(formatMoney(devis.total_tva), 470, tableTop, { width: 75, align: "right" });

      tableTop += 18;
      doc
        .rect(370, tableTop - 5, 180, 25)
        .fill("#e0e0e0")
        .stroke();

      doc
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Total TTC:", 380, tableTop + 3, { width: 80, align: "right" })
        .text(formatMoney(devis.total_ttc), 470, tableTop + 3, { width: 75, align: "right" });

      // === MESSAGE PERSONNALISE ===
      if (devis.custom_message) {
        tableTop += 50;
        doc
          .font("Helvetica-Oblique")
          .fontSize(10)
          .fillColor("#555555")
          .text(devis.custom_message, 50, tableTop, { width: 500 });
      }

      // === PIED DE PAGE ===
      doc
        .fontSize(8)
        .fillColor("#888888")
        .text(
          "Innov'Events - SARL au capital de 1 000 000 000 euros - SIRET: 123 456 789 00012",
          50,
          750,
          { align: "center", width: 500 }
        )
        .text(
          "Ce devis est valable 30 jours a compter de sa date d'emission.",
          50,
          765,
          { align: "center", width: 500 }
        );

      doc.end();

    } catch (err) {
      reject(err);
    }
  });
}

// Formater une date
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

// Formater un montant
function formatMoney(amount) {
  if (amount === null || amount === undefined) return "0,00 €";
  return parseFloat(amount).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " €";
}

module.exports = { generateDevisPDF };
