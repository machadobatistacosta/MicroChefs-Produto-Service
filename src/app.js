const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Importar rotas
const categoriaRoutes = require('./routes/categoriaRoutes');
const produtoRoutes = require('./routes/produtoRoutes');

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        servico: 'ms-produtos',
        status: 'online',
        timestamp: new Date().toISOString()
    });
});

// Rotas da API
app.use('/api/categorias', categoriaRoutes);
app.use('/api/produtos', produtoRoutes);

// Middlewares de erro
app.use(notFound);
app.use(errorHandler);

module.exports = app;
