const express = require('express');
const router = express.Router();

const {
    cadastrarProduto,
    listarProdutos,
    buscarProdutoPorId,
    atualizarProduto,
    excluirProduto,
    alterarStatusProduto,
    listarProdutosPorCategoria
} = require('../controllers/produtoController');

router.route('/')
    .post(cadastrarProduto)
    .get(listarProdutos);

router.get('/categoria/:categoriaId', listarProdutosPorCategoria);

router.route('/:id')
    .get(buscarProdutoPorId)
    .put(atualizarProduto)
    .delete(excluirProduto);

router.patch('/:id/status', alterarStatusProduto);

module.exports = router;