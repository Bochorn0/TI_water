import { Router } from 'express';
import {
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  deleteQuote,
  getQuoteStats,
} from '../controllers/tiwater-quote.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';
import { validateTiWaterApiKey } from '../middlewares/tiwater-api-key.middleware.js';

const router = Router();

router.post('/', validateTiWaterApiKey, createQuote);
router.get('/', authenticate, getQuotes);
router.get('/stats', authenticate, getQuoteStats);
router.get('/:quoteId', authenticate, getQuoteById);
router.patch('/:quoteId', authenticate, updateQuote);
router.put('/:quoteId', authenticate, updateQuote);
router.delete('/:quoteId', authenticate, requirePermission('/tiwater-catalog'), deleteQuote);

export default router;
