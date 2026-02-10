const jwt = require("jsonwebtoken");

// Pas de valeur par defaut : on doit crash si JWT_SECRET n'est pas configure
// sinon on risque de signer des tokens avec une valeur bidon en prod
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET manquant dans les variables d'environnement");
}
const JWT_SECRET = process.env.JWT_SECRET;

// ============================================
// Middleware: verifier que l'utilisateur est connecte
// Ajoute req.user avec les infos du token
// ============================================
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expire" });
  }
}

// ============================================
// Middleware: verifier le role de l'utilisateur
// Usage: roleRequired("admin") ou roleRequired(["admin", "employe"])
// ============================================
function roleRequired(roles) {
  // Si on passe un string, on le met dans un tableau
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    // D'abord verifier l'auth
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentification requise" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Token manquant" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };

      // Verifier le role
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          error: "Acces refuse. Role requis: " + allowedRoles.join(" ou ")
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({ error: "Token invalide ou expire" });
    }
  };
}

// ============================================
// Middleware: optionnel - ajoute req.user si token present
// mais ne bloque pas si pas de token
// ============================================
function authOptional(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    } catch (err) {
      // Token invalide mais on continue quand meme
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
}

module.exports = {
  authRequired,
  roleRequired,
  authOptional
};
