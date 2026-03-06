const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema(
    {
        nome: {
            type: String,
            required: [true, 'O nome da categoria é obrigatório'],
            unique: true,
            trim: true,
            minlength: [2, 'O nome deve ter pelo menos 2 caracteres'],
            maxlength: [50, 'O nome deve ter no máximo 50 caracteres']
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Categoria', categoriaSchema);
