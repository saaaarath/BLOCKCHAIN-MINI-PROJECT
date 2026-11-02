import { MedicalRecord } from '../models/MedicalRecord.js';
import { AccessRequest } from '../models/AccessRequest.js';
export const patientDashboard = async (req, res, next) => { try { res.json({ recordCount: await MedicalRecord.countDocuments({ patientId: req.user._id }), pendingAccessRequests: await AccessRequest.countDocuments({ patientId: req.user._id, status: 'PENDING' }) }); } catch (e) { next(e); } };
export const doctorDashboard = async (req, res, next) => { try { res.json({ requestedAccess: await AccessRequest.countDocuments({ doctorId: req.user._id }), approvedAccess: await AccessRequest.countDocuments({ doctorId: req.user._id, status: 'APPROVED' }) }); } catch (e) { next(e); } };
