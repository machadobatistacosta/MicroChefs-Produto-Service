const express = require('express');
const router = express.Router();

const {
    criarCategoria,
    listarCategorias,
    buscarCategoriaPorId,
    atualizarCategoria,
    excluirCategoria
} = require('../controllers/categoriaController');

router.route('/')
    .post(criarCategoria)
    .get(listarCategorias);

router.route('/:id')
    .get(buscarCategoriaPorId)
    .put(atualizarCategoria)
    .delete(excluirCategoria);

module.exports = router;
