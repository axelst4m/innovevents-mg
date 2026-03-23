# Refactoring OOP Backend - Post correction ECF

## Contexte

Suite a la correction de l'ECF, la competence **CPT 3 - Developper des composants metier** n'a pas ete validee. Le jury a releve que le backend ne presentait pas une architecture OOP avec une separation claire des responsabilites.

L'ensemble du code metier etait ecrit directement dans les fichiers de routes Express, melangeant la gestion HTTP, la logique metier et les requetes SQL dans les memes fonctions.

## Objectif

Refactorer l'integralite du backend en appliquant le pattern **Route -> Controller -> Service -> Model**, qui separe les responsabilites en 4 couches distinctes.

## Architecture mise en place

```
apps/api/src/
  routes/          --> Declaration des routes et middlewares uniquement
  controllers/     --> Couche HTTP (lecture req, appel service, formatage res)
  services/        --> Logique metier (validation, regles, orchestration)
  models/          --> Acces aux donnees (requetes SQL uniquement)
```

### Role de chaque couche

**Route** : Declare les endpoints HTTP et branche les middlewares d'authentification. Ne contient aucune logique. Exemple : `router.get("/", roleRequired("admin"), ContactController.list)`.

**Controller** : Recoit la requete HTTP (`req`, `res`). Extrait les parametres (`req.params`, `req.query`, `req.body`), appelle la methode du Service correspondante, et formate la reponse HTTP. Gere les erreurs en traduisant les exceptions du Service en codes HTTP.

**Service** : Contient toute la logique metier. Valide les donnees, applique les regles (limites, droits, nettoyage), et orchestre les appels au Model et aux utilitaires (logger, mailer). Ne connait pas `req` ni `res`. Lance des exceptions avec une propriete `.status` que le Controller interprete.

**Model** : Execute les requetes SQL via `pool.query()`. Ne contient aucune validation ni regle metier. Retourne les donnees brutes de la base.

### Flux d'une requete type

```
Client HTTP
  --> Route (middleware auth)
    --> Controller (extrait req.body)
      --> Service (valide, nettoie, applique regles)
        --> Model (execute SQL)
      <-- Service (retourne donnees ou throw erreur)
    <-- Controller (res.status().json())
  <-- Client HTTP
```

## Modules refactores

| Module | Model | Service | Controller | Route (avant/apres) |
|--------|-------|---------|------------|---------------------|
| Contact | ContactModel.js | ContactService.js | ContactController.js | 239 -> 22 lignes |
| EventNotes | EventNoteModel.js | EventNoteService.js | EventNoteController.js | 125 -> 15 lignes |
| EventTasks | EventTaskModel.js | EventTaskService.js | EventTaskController.js | 294 -> 21 lignes |
| Reviews | ReviewModel.js | ReviewService.js | ReviewController.js | 399 -> 28 lignes |
| Users | UserModel.js | UserService.js | UserController.js | 329 -> 26 lignes |
| Dashboard | DashboardModel.js | DashboardService.js | DashboardController.js | 116 -> 10 lignes |
| Events | EventModel.js | EventService.js | EventController.js | 438 -> 34 lignes |
| Prospects | ProspectModel.js | ProspectService.js | ProspectController.js | 377 -> 20 lignes |
| Auth | AuthModel.js | AuthService.js | AuthController.js | 562 -> 28 lignes |
| Devis | DevisModel.js | DevisService.js | DevisController.js | 661 -> 39 lignes |

**Total** : ~3 500 lignes de code inline dans les routes ont ete redistribuees en 30 fichiers organises par couche, avec des routes reduites a ~240 lignes au total (declarations uniquement).

## Principes OOP appliques

**Classes avec methodes statiques** : Chaque couche est une classe JavaScript avec des methodes statiques. Ce choix permet de regrouper les methodes par domaine fonctionnel tout en evitant l'instanciation inutile (pas d'etat interne a conserver entre les appels).

**Encapsulation** : Chaque classe ne connait que la couche directement en dessous. Le Controller importe le Service, le Service importe le Model. Jamais de saut de couche.

**Separation des responsabilites (SRP)** : Une classe = une responsabilite. Le Model ne valide pas. Le Service ne connait pas HTTP. Le Controller ne fait pas de SQL.

**Gestion d'erreurs unifiee** : Les Services lancent des exceptions enrichies (`error.status`, `error.errors`) que les Controllers attrapent et traduisent en reponses HTTP appropriees. Cela evite de dupliquer la logique d'erreur dans chaque route.

## Exemple concret : module Contact

### Avant (tout dans routes/contact.js)

```javascript
router.post("/", authOptional, async (req, res) => {
  // Validation inline
  // Requete SQL inline
  // Logging inline
  // Formatage reponse inline
});
```

### Apres (4 fichiers separes)

**ContactModel.js** - uniquement le SQL :
```javascript
class ContactModel {
  static async create({ firstname, lastname, email, phone, subject, message, userId }) {
    const { rows } = await pool.query(
      `INSERT INTO contact_messages (...) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`,
      [firstname, lastname, email, phone, subject, message, userId]
    );
    return rows[0];
  }
}
```

**ContactService.js** - validation et regles metier :
```javascript
class ContactService {
  static async sendMessage(data, userId = null) {
    // Validation des champs obligatoires
    // Verification format email
    // Nettoyage des donnees (trim, toLowerCase)
    const created = await ContactModel.create(cleanData);
    await logAction({ type_action: "CONTACT_MESSAGE_SENT", ... });
    return created;
  }
}
```

**ContactController.js** - couche HTTP :
```javascript
class ContactController {
  static async send(req, res) {
    try {
      const userId = req.user?.id || null;
      const created = await ContactService.sendMessage(req.body, userId);
      return res.status(201).json({ ok: true, contact: created });
    } catch (e) {
      if (e.status === 400 && e.errors) return res.status(400).json({ ok: false, errors: e.errors });
      return res.status(500).json({ ok: false, error: "Erreur serveur" });
    }
  }
}
```

**routes/contact.js** - declaration pure :
```javascript
router.post("/", authOptional, ContactController.send);
router.get("/", roleRequired("admin"), ContactController.list);
router.get("/:id", roleRequired("admin"), ContactController.getById);
router.patch("/:id", roleRequired("admin"), ContactController.update);
router.delete("/:id", roleRequired("admin"), ContactController.delete);
```

## Impact sur le reste du projet

Le fichier `app.js` n'a pas ete modifie. Les routes sont montees exactement de la meme maniere qu'avant :

```javascript
app.use("/api/contact", contactRoutes);
app.use("/api/reviews", reviewsRoutes);
// etc.
```

Les reponses HTTP sont strictement identiques (memes codes, memes JSON). Le frontend n'a subi aucune modification. Les tests existants restent valides.

## Conclusion

Ce refactoring demontre la maitrise de la programmation orientee objet appliquee a une architecture backend Node.js/Express :
- Separation claire des responsabilites entre les couches
- Utilisation de classes pour structurer le code par domaine metier
- Encapsulation de la logique metier independamment du protocole HTTP
- Gestion d'erreurs centralisee et coherente
- Code maintenable et testable unitairement (chaque couche peut etre testee isolement)
