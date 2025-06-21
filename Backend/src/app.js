// backend/src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import vendorRoutes from './routes/vendors.js';
import vehicleRoutes from './routes/vehicles.js';
import driverRoutes from './routes/drivers.js';
import documentRoutes from './routes/documents.js';
import statsRoutes from './routes/stats.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], // allow both ports
  credentials: true,
}));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/drivers', driverRoutes);

app.use('/api/vehicles', vehicleRoutes);

// Document routes
app.use('/api', documentRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Auth routes
app.use('/api/auth', authRoutes);

// Vendor routes
app.use('/api/vendors', vendorRoutes);

// Stats routes
app.use('/api/stats', statsRoutes);

// Global error handler
app.use(errorHandler);

export default app;
