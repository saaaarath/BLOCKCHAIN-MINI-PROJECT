import { AuditLog } from '../models/AuditLog.js';

export const audit = (userId, action, details = {}) => AuditLog.create({ userId, action, ...details });
