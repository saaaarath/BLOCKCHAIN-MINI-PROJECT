import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { blockchainHistory } from '../controllers/recordController.js';
import { getTransaction } from '../services/blockchainService.js';
export const blockchainRoutes = Router();
blockchainRoutes.use(authenticate);
blockchainRoutes.get('/history', blockchainHistory);
blockchainRoutes.get('/record/:transactionHash', async (req, res, next) => { try { const transaction = await getTransaction(req.params.transactionHash); if (!transaction) return res.status(404).json({ error: 'Transaction not found' }); res.json({ transaction }); } catch (e) { next(e); } });
