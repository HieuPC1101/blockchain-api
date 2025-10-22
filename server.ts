import app from './src/app';

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`🚀 Blockchain API Server is running on http://localhost:${port}`);
    console.log(`📊 API Documentation: http://localhost:${port}/api`);
    console.log(`🔍 Health Check: http://localhost:${port}/`);
});
