/**
 * INTENTIONALLY VULNERABLE DATABASE SETUP
 * For hackathon demo purposes only — DO NOT use in production.
 */
const Database = require("better-sqlite3");

const db = new Database(":memory:");

db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    balance REAL DEFAULT 100.0
  );

  CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 10
  );

  CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    total REAL,
    status TEXT DEFAULT 'pending'
  );

  CREATE TABLE coupons (
    code TEXT PRIMARY KEY,
    discount REAL,
    used_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 1
  );

  -- Seed data
  INSERT INTO users (username, password, email, role, balance) VALUES
    ('admin', 'admin123', 'admin@demo.com', 'admin', 9999.0),
    ('alice', 'password1', 'alice@demo.com', 'user', 250.0),
    ('bob', 'password2', 'bob@demo.com', 'user', 150.0);

  INSERT INTO products (name, price, stock) VALUES
    ('Widget A', 29.99, 50),
    ('Widget B', 49.99, 30),
    ('Premium Plan', 199.99, 100);

  INSERT INTO coupons (code, discount, max_uses) VALUES
    ('SAVE10', 10.0, 1),
    ('VIP50', 50.0, 3);
`);

module.exports = db;
