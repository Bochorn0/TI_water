import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import {
  createSecretLink,
  listSecretLinks,
  deleteSecretLink,
  getPublicMeta,
  unlockSecretLink,
} from '../controllers/tiwater-secret-link.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

function clientIpForRateLimit(req) {
  const raw = req.ip || req.socket?.remoteAddress || 'unknown';
  if (typeof raw !== 'string') return 'unknown';
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(raw)) {
    return raw.slice(0, raw.lastIndexOf(':'));
  }
  return raw;
}

const unlockLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Espere e intente de nuevo.' },
  keyGenerator: (req) => ipKeyGenerator(clientIpForRateLimit(req)),
});

const publicReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(clientIpForRateLimit(req)),
});

// Public: no JWT (anyone with link + password)
router.get('/public/:slug', publicReadLimiter, getPublicMeta);
router.post('/public/:slug/unlock', unlockLimiter, unlockSecretLink);

// Admin / internal: catalog, quotes, or users permission (same as sidebar managers)
const manageSecretLinks = [authenticate, requirePermission('/tiwater-catalog', '/tiwater-quotes', '/usuarios')];

router.get('/', ...manageSecretLinks, listSecretLinks);
router.post('/', ...manageSecretLinks, createSecretLink);
router.delete('/:id', ...manageSecretLinks, deleteSecretLink);

export default router;
