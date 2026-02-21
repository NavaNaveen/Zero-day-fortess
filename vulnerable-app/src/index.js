/**
 * ⚠️  INTENTIONALLY VULNERABLE APPLICATION
 * For Zero Day Fortress hackathon demo ONLY.
 * Contains seeded vulnerabilities:
 *  - SQL Injection (auth bypass)
 *  - XSS (reflected)
 *  - IDOR (order access)
 *  - Business Logic (negative quantity, coupon abuse)
 *  - Path Traversal (receipt download)
 *  - User Enumeration
 *  - Missing Rate Limiting
 *  - Sensitive Data Exposure (passwords in API)
 */

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" })); // ❌ VULN: Wildcard CORS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ❌ No security headers (no helmet, no CSP, no HSTS)

app.get("/", (req, res) => {
  res.json({
    app: "Vulnerable Demo Store",
    warning: "⚠️  This app is intentionally vulnerable for security testing",
    endpoints: [
      "POST /auth/login",
      "GET  /auth/users",
      "GET  /products",
      "GET  /products/search?q=",
      "GET  /products/orders/:id",
      "POST /orders/purchase",
      "GET  /orders/receipt?file=",
    ],
  });
});

// ❌ VULN: Exposes version info
app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0", node: process.version, env: process.env });
});

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);

app.listen(PORT, () => {
  console.log(`🎯 Vulnerable target running on http://localhost:${PORT}`);
  console.log("⚠️  This app is intentionally vulnerable — SANDBOX ONLY");
});
