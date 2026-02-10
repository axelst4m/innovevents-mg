// app.js - Configuration Express separee pour les tests
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const prospectsRoutes = require("./routes/prospects");
const authRoutes = require("./routes/auth");
const eventsRoutes = require("./routes/events");
const devisRoutes = require("./routes/devis");
const dashboardRoutes = require("./routes/dashboard");
const contactRoutes = require("./routes/contact");
const reviewsRoutes = require("./routes/reviews");
const eventNotesRoutes = require("./routes/eventNotes");
const eventTasksRoutes = require("./routes/eventTasks");
const usersRoutes = require("./routes/users");

const app = express();

// Whitelist des origines CORS - plus sécurisé qu'accepter toutes les origines
const allowedOrigins = [
  "http://localhost:5173",    // Vite dev
  "http://localhost:3000",    // API (same-origin)
  process.env.FRONTEND_URL    // prod
].filter(Boolean);

// Limiteur global - 100 requêtes par 15 minutes par IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Trop de requêtes depuis cette IP, réessayez plus tard",
  standardHeaders: true, // Retourne les infos de rate limit dans `RateLimit-*` headers
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  skip: (req) => process.env.NODE_ENV === "test" // Désactive en mode test
});

// Limiteur strict pour l'authentification - 10 requêtes par 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Trop de tentatives de connexion, réessayez dans 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test"
});

app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (curl, Postman, mobile)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origine non autorisée par CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(globalLimiter); // Appliquer le limiteur global

// Desactive les logs morgan en mode test
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/devis", devisRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/events", eventNotesRoutes);
app.use("/api/events", eventTasksRoutes);
app.use("/api/tasks", eventTasksRoutes);
app.use("/api/users", usersRoutes);
app.use("/api", prospectsRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/api/hello", (req, res) => res.json({ message: "Hello Innov'Events API" }));

module.exports = app;
module.exports.authLimiter = authLimiter;
