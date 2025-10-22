import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import blockchainRouter from './router/blockchain.router';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', blockchainRouter);

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Blockchain API Server',
        version: '1.0.0',
        timestamp: Date.now()
    });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: err.message || 'Internal server error',
            details: null
        },
        timestamp: Date.now()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found',
            details: null
        },
        timestamp: Date.now()
    });
});

export default app;