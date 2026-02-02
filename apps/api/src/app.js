// app.js - Configuration Express separee pour les tests
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

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

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

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
