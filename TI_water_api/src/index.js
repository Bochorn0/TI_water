import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import roleRoutes from './routes/role.routes.js';
import tiwaterQuoteRoutes from './routes/tiwater-quote.routes.js';
import { authenticate, requirePermission } from './middlewares/auth.middleware.js';

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.API_RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas solicitudes. Intente de nuevo mas tarde.' }
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
app.use('/api/v2.0/tiwater/quotes', tiwaterQuoteRoutes);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
  console.log(`TI Water API running on port ${PORT}`);
});
