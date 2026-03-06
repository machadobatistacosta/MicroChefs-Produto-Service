const mongoose = require('mongoose');

const produtoSchema = new mongoose.Schema(
    {
        nome: {
            type: String,
            required: [true, 'O nome do produto é obrigatório'],
            trim: true,
            minlength: [2, 'O nome deve ter pelo menos 2 caracteres'],
            maxlength: [100, 'O nome deve ter no máximo 100 caracteres']
        },
        descricao: {
            type: String,
            trim: true,
            maxlength: [500, 'A descrição deve ter no máximo 500 caracteres'],
            default: ''
        },
        preco: {
            type: Number,
            required: [true, 'O preço do produto é obrigatório'],
            min: [0.01, 'O preço deve ser maior que zero']
        },
        categoriaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Categoria',
            required: [true, 'A categoria do produto é obrigatória']
        },
        ativo: {
            type: Boolean,
            default: true
        },
        imagem: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Produto', produtoSchema);