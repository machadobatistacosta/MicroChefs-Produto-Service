const Produto = require('../models/Produto');
const Categoria = require('../models/Categoria');

// @desc    Cadastrar novo produto
// @route   POST /api/produtos
const cadastrarProduto = async (req, res, next) => {
    try {
        const { nome, descricao, preco, categoriaId, imagem } = req.body;

        // Validações básicas
        if (!nome || !preco || !categoriaId) {
            res.status(400);
            throw new Error('Nome, preço e categoria são obrigatórios');
        }

        // Verifica se a categoria existe
        const categoriaExiste = await Categoria.findById(categoriaId);
        if (!categoriaExiste) {
            res.status(404);
            throw new Error('Categoria não encontrada');
        }

        const produto = await Produto.create({
            nome,
            descricao,
            preco,
            categoriaId,
            imagem
        });

        // Popula a categoria na resposta
        const produtoPopulado = await Produto.findById(produto._id).populate(
            'categoriaId',
            'nome'
        );

        res.status(201).json({
            sucesso: true,
            mensagem: 'Produto cadastrado com sucesso',
            dados: produtoPopulado
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Listar todos os produtos
// @route   GET /api/produtos
const listarProdutos = async (req, res, next) => {
    try {
        // Filtros opcionais via query string
        const filtro = {};

        // Filtrar por categoria
        if (req.query.categoria) {
            filtro.categoriaId = req.query.categoria;
        }

        // Filtrar por status (ativo/inativo)
        if (req.query.ativo !== undefined) {
            filtro.ativo = req.query.ativo === 'true';
        }

        // Busca por nome (parcial, case-insensitive)
        if (req.query.nome) {
            filtro.nome = { $regex: req.query.nome, $options: 'i' };
        }

        // Filtro por faixa de preço
        if (req.query.precoMin || req.query.precoMax) {
            filtro.preco = {};
            if (req.query.precoMin) filtro.preco.$gte = Number(req.query.precoMin);
            if (req.query.precoMax) filtro.preco.$lte = Number(req.query.precoMax);
        }

        // Paginação
        const pagina = parseInt(req.query.pagina) || 1;
        const limite = parseInt(req.query.limite) || 10;
        const skip = (pagina - 1) * limite;

        const [produtos, total] = await Promise.all([
            Produto.find(filtro)
                .populate('categoriaId', 'nome')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limite),
            Produto.countDocuments(filtro)
        ]);

        res.status(200).json({
            sucesso: true,
            quantidade: produtos.length,
            total,
            pagina,
            totalPaginas: Math.ceil(total / limite),
            dados: produtos
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Buscar produto por ID
// @route   GET /api/produtos/:id
const buscarProdutoPorId = async (req, res, next) => {
    try {
        const produto = await Produto.findById(req.params.id).populate(
            'categoriaId',
            'nome'
        );

        if (!produto) {
            res.status(404);
            throw new Error('Produto não encontrado');
        }

        res.status(200).json({
            sucesso: true,
            dados: produto
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Atualizar produto
// @route   PUT /api/produtos/:id
const atualizarProduto = async (req, res, next) => {
    try {
        const produto = await Produto.findById(req.params.id);

        if (!produto) {
            res.status(404);
            throw new Error('Produto não encontrado');
        }

        // Se está atualizando a categoria, verifica se existe
        if (req.body.categoriaId) {
            const categoriaExiste = await Categoria.findById(req.body.categoriaId);
            if (!categoriaExiste) {
                res.status(404);
                throw new Error('Categoria não encontrada');
            }
        }

        const produtoAtualizado = await Produto.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('categoriaId', 'nome');

        res.status(200).json({
            sucesso: true,
            mensagem: 'Produto atualizado com sucesso',
            dados: produtoAtualizado
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Excluir produto
// @route   DELETE /api/produtos/:id
const excluirProduto = async (req, res, next) => {
    try {
        const produto = await Produto.findById(req.params.id);

        if (!produto) {
            res.status(404);
            throw new Error('Produto não encontrado');
        }

        await Produto.findByIdAndDelete(req.params.id);

        res.status(200).json({
            sucesso: true,
            mensagem: 'Produto excluído com sucesso'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Ativar/Desativar produto
// @route   PATCH /api/produtos/:id/status
const alterarStatusProduto = async (req, res, next) => {
    try {
        const produto = await Produto.findById(req.params.id);

        if (!produto) {
            res.status(404);
            throw new Error('Produto não encontrado');
        }

        produto.ativo = !produto.ativo;
        await produto.save();

        res.status(200).json({
            sucesso: true,
            mensagem: `Produto ${produto.ativo ? 'ativado' : 'desativado'} com sucesso`,
            dados: produto
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Listar produtos por categoria
// @route   GET /api/produtos/categoria/:categoriaId
const listarProdutosPorCategoria = async (req, res, next) => {
    try {
        const categoria = await Categoria.findById(req.params.categoriaId);

        if (!categoria) {
            res.status(404);
            throw new Error('Categoria não encontrada');
        }

        const produtos = await Produto.find({
            categoriaId: req.params.categoriaId,
            ativo: true
        }).populate('categoriaId', 'nome');

        res.status(200).json({
            sucesso: true,
            categoria: categoria.nome,
            quantidade: produtos.length,
            dados: produtos
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    cadastrarProduto,
    listarProdutos,
    buscarProdutoPorId,
    atualizarProduto,
    excluirProduto,
    alterarStatusProduto,
    listarProdutosPorCategoria
};
