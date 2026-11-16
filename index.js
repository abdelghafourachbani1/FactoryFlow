import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import connect from './config/db.js';
import AdminRoute from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import matierPrRoutes from './routes/matierPr.routes.js';
import productRoutes from './routes/product.routes.js';
import ordreRoutes from './routes/ordreFabrication.routes.js';
import { setupSwagger } from './swagger.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const app = express();
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (req, res) => res.json({ success: true, database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api/installation', AdminRoute);
setupSwagger(app);
app.use('/api/auth', authRoutes);
app.use('/api/matierPr', matierPrRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', ordreRoutes);
app.use((req, res) => res.status(404).json({ success: false, message: 'Route introuvable.' }));
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT || 3000);
  connect()
    .then(() => app.listen(port, '0.0.0.0', () => console.log(`FactoryFlow API écoute sur le port ${port}`)))
    .catch(error => { console.error(`Impossible de démarrer FactoryFlow : ${error.message}`); process.exitCode = 1; });
}
