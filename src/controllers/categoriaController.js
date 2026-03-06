const Categoria = require('../models/Categoria');

// @desc    Criar nova categoria
// @route   POST /api/categorias
const criarCategoria = async (req, res, next) => {
    try {
        const { nome } = req.body;

        if (!nome) {
            res.status(400);
            throw new Error('O nome da categoria é obrigatório');
        }

        const categoria = await Categoria.create({ nome });

        res.status(201).json({
            sucesso: true,
            mensagem: 'Categoria criada com sucesso',
            dados: categoria
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Listar todas as categorias
// @route   GET /api/categorias
const listarCategorias = async (req, res, next) => {
    try {
        const categorias = await Categoria.find().sort({ nome: 1 });

        res.status(200).json({
            sucesso: true,
            quantidade: categorias.length,
            dados: categorias
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Buscar categoria por ID
// @route   GET /api/categorias/:id
const buscarCategoriaPorId = async (req, res, next) => {
    try {
        const categoria = await Categoria.findById(req.params.id);

        if (!categoria) {
            res.status(404);
            throw new Error('Categoria não encontrada');
        }

        res.status(200).json({
            sucesso: true,
            dados: categoria
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar categoria
// @route   PUT /api/categorias/:id
const atualizarCategoria = async (req, res, next) => {
    try {
        const categoria = await Categoria.findById(req.params.id);

        if (!categoria) {
            res.status(404);
            throw new Error('Categoria não encontrada');
        }

        const categoriaAtualizada = await Categoria.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            sucesso: true,
            mensagem: 'Categoria atualizada com sucesso',
            dados: categoriaAtualizada
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Excluir categoria
// @route   DELETE /api/categorias/:id
const excluirCategoria = async (req, res, next) => {
    try {
        const categoria = await Categoria.findById(req.params.id);

        if (!categoria) {
            res.status(404);
            throw new Error('Categoria não encontrada');
        }

        // Verifica se existem produtos vinculados
        const Produto = require('../models/Produto');
        const produtosVinculados = await Produto.countDocuments({
            categoriaId: req.params.id
        });

        if (produtosVinculados > 0) {
            res.status(400);
            throw new Error(
                `Não é possível excluir. Existem ${produtosVinculados} produto(s) vinculado(s) a esta categoria`
            );
        }

        await Categoria.findByIdAndDelete(req.params.id);

        res.status(200).json({
            sucesso: true,
            mensagem: 'Categoria excluída com sucesso'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    criarCategoria,
    listarCategorias,
    buscarCategoriaPorId,
    atualizarCategoria,
    excluirCategoria
};
