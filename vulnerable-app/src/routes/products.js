/**
 * VULN-4: IDOR — access any user's orders by ID
 * VULN-5: Missing rate limit on search
 * VULN-6: XSS via reflected search term
 */
const express = require("express");
const db = require("../db/database");
const router = express.Router();

router.get("/", (req, res) => {
  const products = db.prepare("SELECT * FROM products").all();
  res.json(products);
});

// ❌ VULN: XSS — reflects input without sanitization
router.get("/search", (req, res) => {
  const { q } = req.query;
  const results = db.prepare(`SELECT * FROM products WHERE name LIKE '%${q}%'`).all();
  // Reflected XSS in HTML response
  res.send(`<html><body><h1>Search: ${q}</h1><pre>${JSON.stringify(results)}</pre></body></html>`);
});

// ❌ VULN: IDOR — no ownership check, any user can get any order
router.get("/orders/:id", (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  if (!order) return res.status(404).json({ error: "Not found" });
  res.json(order);
});

module.exports = router;
