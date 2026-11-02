import { AppError } from '../utils/errors.js';

export const requireFields = (...fields) => (req, _res, next) => {
  const missing = fields.filter((field) => typeof req.body?.[field] !== 'string' || !req.body[field].trim());
  if (missing.length) return next(new AppError(400, `Missing fields: ${missing.join(', ')}`));
  next();
};
