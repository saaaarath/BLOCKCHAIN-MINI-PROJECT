import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (user) => jwt.sign(
  { sub: user._id.toString(), role: user.role, walletAddress: user.walletAddress },
  env.jwtSecret,
  { expiresIn: env.jwtExpiresIn }
);

export const signRefreshToken = (user) => jwt.sign(
  { sub: user._id.toString(), type: 'refresh' },
  env.jwtSecret,
  { expiresIn: env.jwtRefreshExpiresIn }
);

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);
