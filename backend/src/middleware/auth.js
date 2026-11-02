import { User } from '../models/User.js';
import { AppError } from '../utils/errors.js';
import { verifyToken } from '../utils/tokens.js';

export const authenticate = async (req, _res, next) => {
  try {
    const header = req.get('authorization');
    if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Authentication required');
    const payload = verifyToken(header.slice(7));
    const user = await User.findById(payload.sub);
    if (!user || user.accountStatus !== 'ACTIVE') throw new AppError(401, 'Invalid authentication');
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, 'Invalid authentication'));
  }
};

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new AppError(403, 'Insufficient permissions'));
  next();
};
