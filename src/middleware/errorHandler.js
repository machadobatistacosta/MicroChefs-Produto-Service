// Middleware para rotas não encontradas
const notFound = (req, res, next) => {
    const error = new Error(`Rota não encontrada: ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Middleware global de tratamento de erros
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    console.error(`❌ Erro: ${err.message}`);

    // Erro de validação do Mongoose
    if (err.name === 'ValidationError') {
        const mensagens = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            sucesso: false,
            mensagem: 'Erro de validação',
            erros: mensagens
        });
    }

    // Erro de ID inválido do Mongoose
    if (err.name === 'CastError') {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'ID inválido'
        });
    }

    // Erro de campo único duplicado
    if (err.code === 11000) {
        const campo = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            sucesso: false,
            mensagem: `Já existe um registro com esse ${campo}`
        });
    }

    res.status(statusCode).json({
        sucesso: false,
        mensagem: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = { notFound, errorHandler };