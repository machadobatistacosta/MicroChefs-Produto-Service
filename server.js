require('dotenv').config();

const app = require('./src/app');
const connectDatabase = require('./src/config/database');

const PORT = process.env.PORT || 3002;

// Conectar ao banco e iniciar o servidor
const startServer = async () => {
    await connectDatabase();

    app.listen(PORT, () => {
        console.log(`\n🍔 Microsserviço de Produtos rodando na porta ${PORT}`);
        console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
        console.log(`📍 Produtos:     http://localhost:${PORT}/api/produtos`);
        console.log(`📍 Categorias:   http://localhost:${PORT}/api/categorias\n`);
    });
};

startServer();
