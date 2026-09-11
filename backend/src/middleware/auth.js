const jwt = require('jsonwebtoken');

const secret = () => process.env.JWT_SECRET || 'dev-only-insecure-secret';

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, secret(), { expiresIn: '30d' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, secret());
    req.userId = payload.sub;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

module.exports = { requireAuth, signToken };
