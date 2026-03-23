const express = require("express");
const router = express.Router();

const DevisController = require("../controllers/DevisController");
const { authRequired, roleRequired } = require("../middlewares/auth");

// GET    /api/devis                           - Liste des devis (admin)
router.get("/", roleRequired("admin"), DevisController.list);

// GET    /api/devis/client                    - Devis du client connecte
router.get("/client", authRequired, DevisController.clientList);

// GET    /api/devis/:id                       - Detail d'un devis
router.get("/:id", authRequired, DevisController.getById);

// POST   /api/devis                           - Creer un devis (admin)
router.post("/", roleRequired("admin"), DevisController.create);

// PUT    /api/devis/:id                       - Modifier un devis (admin)
router.put("/:id", roleRequired("admin"), DevisController.update);

// POST   /api/devis/:id/lignes                - Ajouter une ligne (admin)
router.post("/:id/lignes", roleRequired("admin"), DevisController.addLigne);

// DELETE /api/devis/:devisId/lignes/:ligneId  - Supprimer une ligne (admin)
router.delete("/:devisId/lignes/:ligneId", roleRequired("admin"), DevisController.deleteLigne);

// POST   /api/devis/:id/send                  - Envoyer le devis
router.post("/:id/send", roleRequired("admin"), DevisController.send);

// POST   /api/devis/:id/accept                - Accepter le devis
router.post("/:id/accept", authRequired, DevisController.accept);

// POST   /api/devis/:id/refuse                - Refuser le devis
router.post("/:id/refuse", authRequired, DevisController.refuse);

// POST   /api/devis/:id/request-modification  - Demander une modification
router.post("/:id/request-modification", authRequired, DevisController.requestModification);

// GET    /api/devis/:id/pdf                   - Generer le PDF
router.get("/:id/pdf", authRequired, DevisController.getPdf);

module.exports = router;
