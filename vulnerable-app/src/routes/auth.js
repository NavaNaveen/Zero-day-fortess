/**
 * VULN-1: SQL Injection in login
 * VULN-2: Password in plaintext
 * VULN-3: User enumeration via error messages
 */
const express = require("express");
const db = require("../db/database");
const router = express.Router();

// ❌ VULNERABLE: Raw SQL string concatenation
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // SQL INJECTION: attacker can use ' OR '1'='1 to bypass auth
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  const user = db.prepare(query).get();

  if (user) {
    res.json({ success: true, user: { id: user.id, username: user.username, role: user.role }, token: `token-${user.id}` });
  } else {
    // ❌ VULN: Leaks whether username exists
    const exists = db.prepare(`SELECT id FROM users WHERE username = '${username}'`).get();
    res.status(401).json({ error: exists ? "Invalid password" : "User not found" });
  }
});

// ❌ VULNERABLE: No auth check, returns all users
router.get("/users", (req, res) => {
  const users = db.prepare("SELECT * FROM users").all();
  res.json(users); // Exposes passwords
});

module.exports = router;
