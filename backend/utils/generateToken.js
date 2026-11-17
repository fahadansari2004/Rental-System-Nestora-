const jwt = require('jsonwebtoken');

const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'nestora_super_secret_jwt_key_2026', {
    expiresIn,
  });
};

module.exports = generateToken;

