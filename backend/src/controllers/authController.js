// Authentication controller for register/login endpoints
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_12345';
const BCRYPT_ROUNDS = 10;

async function register(req, res) {
  const { username, email, password } = req.body;

  console.log(`[Auth] Registering user: ${username}`);

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password required' });
  }

  try {
    // Check if user exists
    const existingUsers = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const userId = `usr_${uuidv4().substring(0, 8)}`;
    await db.query(
      `INSERT INTO users (id, username, email, password, created_at) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [userId, username, email, hashedPassword, new Date().toISOString()]
    );

    // Create JWT token
    const token = jwt.sign({ userId, username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    console.log(`[Auth] User registered: ${userId}`);

    return res.status(201).json({
      success: true,
      userId,
      username,
      email,
      token,
    });
  } catch (err) {
    console.error('[Auth] Registration error:', err.message);
    return res.status(500).json({
      error: 'Registration failed',
      message: err.message,
    });
  }
}

async function login(req, res) {
  const { username, password } = req.body;

  console.log(`[Auth] Login attempt: ${username}`);

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    // Find user
    const users = await db.query('SELECT * FROM users WHERE username = $1', [username]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d',
    });

    console.log(`[Auth] Login successful: ${user.id}`);

    return res.json({
      success: true,
      userId: user.id,
      username: user.username,
      email: user.email,
      token,
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    return res.status(500).json({
      error: 'Login failed',
      message: err.message,
    });
  }
}

module.exports = {
  register,
  login,
};
