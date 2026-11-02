import { AccessRequest } from '../models/AccessRequest.js';
import { User } from '../models/User.js';
import { audit } from '../services/auditService.js';
import { hasBlockchainAccess, readAccessRequests, verifyAccessTransaction } from '../services/blockchainService.js';
import { AppError } from '../utils/errors.js';

export const requestAccess = async (req, res, next) => {
  try {
    const patient = await User.findOne({ _id: req.body.patientId, role: 'PATIENT' });
    if (!patient) throw new AppError(404, 'Patient not found');
    const transactionHash = req.body.transactionHash
      ? await verifyAccessTransaction(req.body.transactionHash, 'AccessRequested', patient.walletAddress, req.user.walletAddress)
      : undefined;
    const request = await AccessRequest.findOneAndUpdate({ patientId: patient._id, doctorId: req.user._id }, { status: 'PENDING', ...(transactionHash ? { transactionHash } : {}) }, { upsert: true, new: true, setDefaultsOnInsert: true });
    await audit(req.user._id, 'ACCESS_REQUESTED', { transactionHash });
    res.status(201).json({ request, blockchainAction: 'Submit requestAccess(patientWallet) using the doctor wallet' });
  } catch (e) { next(e); }
};

export const requests = async (req, res, next) => { try { const filter = req.user.role === 'PATIENT' ? { patientId: req.user._id } : { doctorId: req.user._id }; res.json({ requests: await AccessRequest.find(filter).populate('patientId doctorId', 'name walletAddress role') }); } catch (e) { next(e); } };

const update = (status, action) => async (req, res, next) => {
  try {
    const request = await AccessRequest.findOne({ patientId: req.user._id, doctorId: req.body.doctorId }).populate('doctorId');
    if (!request) throw new AppError(404, 'Access request not found');
    if (!req.body.transactionHash) throw new AppError(400, 'Patient blockchain transaction hash is required');
    const eventName = status === 'APPROVED' ? 'AccessGranted' : status === 'REJECTED' ? 'AccessRejected' : 'AccessRevoked';
    const transactionHash = await verifyAccessTransaction(req.body.transactionHash, eventName, req.user.walletAddress, request.doctorId.walletAddress);
    request.status = status;
    request.transactionHash = transactionHash;
    await request.save();
    await audit(req.user._id, action, { transactionHash });
    res.json({ request });
  } catch (e) { next(e); }
};
export const approve = update('APPROVED', 'ACCESS_GRANTED');
export const reject = update('REJECTED', 'ACCESS_REJECTED');
export const revoke = update('REVOKED', 'ACCESS_REVOKED');

export const verifyAccess = async (req, res, next) => { try { const doctor = await User.findById(req.user._id); const patient = await User.findById(req.params.patientId); res.json({ authorized: Boolean(patient && doctor && await hasBlockchainAccess(patient.walletAddress, doctor.walletAddress)) }); } catch (e) { next(e); } };
export const blockchainRequests = async (req, res, next) => { try { res.json({ doctors: await readAccessRequests(req.user.walletAddress) }); } catch (e) { next(e); } };
