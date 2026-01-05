const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ ok: true }));
app.get("/api/hello", (req, res) => res.json({ message: "Hello Innov'Events API" }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));