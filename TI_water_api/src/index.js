import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import roleRoutes from './routes/role.routes.js';
import tiwaterQuoteRoutes from './routes/tiwater-quote.routes.js';
import tiwaterProductRoutes from './routes/tiwater-product.routes.js';
import { authenticate, requirePermission } from './middlewares/auth.middleware.js';

const app = express();

// Azure App Service (and similar) send X-Forwarded-*; required so express-rate-limit can identify clients
app.set('trust proxy', process.env.TRUST_PROXY === 'false' ? false : 1);

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

/** Azure / some proxies set req.ip as "a.b.c.d:port"; express-rate-limit rejects that */
function clientIpForRateLimit(req) {
  const raw = req.ip || req.socket?.remoteAddress || 'unknown';
  if (typeof raw !== 'string') return 'unknown';
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(raw)) {
    return raw.slice(0, raw.lastIndexOf(':'));
  }
  return raw;
}

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.API_RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas solicitudes. Intente de nuevo mas tarde.' },
  keyGenerator: (req) => ipKeyGenerator(clientIpForRateLimit(req)),
});

app.use('/api', apiLimiter);

app.get('/health', (_req, res) => {
  res.json({ message: 'TI Water API Working' });
});
app.get('/api/v1.0/health', (_req, res) => {
  res.json({ message: 'TI Water API Working', status: 'ok' });
});

app.use('/api/v1.0/auth', authRoutes);
app.use('/api/v1.0/users', authenticate, requirePermission('/usuarios'), userRoutes);
app.use('/api/v1.0/roles', authenticate, requirePermission('/usuarios'), roleRoutes);
app.use('/api/v1.0/tiwater/products', tiwaterProductRoutes);
app.use('/api/v1.0/tiwater/quotes', tiwaterQuoteRoutes);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3009;

if (!process.env.SECRET_KEY?.trim()) {
  console.error(
    '[FATAL] SECRET_KEY is not set. JWT login will fail. In Azure: App Service → Configuration → Application settings → add SECRET_KEY (e.g. run locally: openssl rand -hex 32).',
  );
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`TI Water API running on port ${PORT}`);
});
