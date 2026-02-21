/**
 * VULN-7: Business logic — negative quantity price manipulation
 * VULN-8: Coupon abuse — no per-user usage tracking
 * VULN-9: No rate limiting on purchase endpoint
 */
const express = require("express");
const db = require("../db/database");
const router = express.Router();

// ❌ VULN: Negative quantity → negative total → money credited to attacker
router.post("/purchase", (req, res) => {
  const { user_id, product_id, quantity, coupon_code } = req.body;

  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(product_id);
  if (!product) return res.status(404).json({ error: "Product not found" });

  // ❌ No validation that quantity > 0
  let total = product.price * quantity;

  if (coupon_code) {
    // ❌ VULN: Coupon can be reused (only checks global used_count, not per-user)
    const coupon = db.prepare("SELECT * FROM coupons WHERE code = ?").get(coupon_code);
    if (coupon && coupon.used_count < coupon.max_uses) {
      total = total - coupon.discount;
      db.prepare("UPDATE coupons SET used_count = used_count + 1 WHERE code = ?").run(coupon_code);
    }
  }

  // ❌ If total is negative, user gains money
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(user_id);
  if (!user) return res.status(404).json({ error: "User not found" });

  db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(total, user_id);

  const order = db.prepare(
    "INSERT INTO orders (user_id, product_id, quantity, total, status) VALUES (?, ?, ?, ?, 'complete')"
  ).run(user_id, product_id, quantity, total);

  res.json({ order_id: order.lastInsertRowid, total, message: "Order placed" });
});

// ❌ VULN: Path traversal in receipt download
router.get("/receipt", (req, res) => {
  const { file } = req.query;
  const fs = require("fs");
  // ❌ No path validation — ../../etc/passwd works
  try {
    const content = fs.readFileSync(`./receipts/${file}`, "utf8");
    res.send(content);
  } catch {
    res.status(404).json({ error: "Receipt not found" });
  }
});

module.exports = router;
