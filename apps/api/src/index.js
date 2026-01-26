const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const prospectsRoutes = require("./routes/prospects");
const authRoutes = require("./routes/auth");
const eventsRoutes = require("./routes/events");
const devisRoutes = require("./routes/devis");
const dashboardRoutes = require("./routes/dashboard");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/devis", devisRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", prospectsRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/api/hello", (req, res) => res.json({ message: "Hello Innov'Events API" }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));