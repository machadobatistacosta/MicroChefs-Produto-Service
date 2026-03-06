class ProductController {
    constructor(productModel) {
        this.productModel = productModel;
    }

    async createProduct(req, res) {
        try {
            const productData = req.body;
            const newProduct = await this.productModel.create(productData);
            res.status(201).json(newProduct);
        } catch (error) {
            res.status(500).json({ message: 'Error creating product', error });
        }
    }

    async getProduct(req, res) {
        try {
            const productId = req.params.id;
            const product = await this.productModel.findById(productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.status(200).json(product);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving product', error });
        }
    }

    async updateProduct(req, res) {
        try {
            const productId = req.params.id;
            const updatedData = req.body;
            const updatedProduct = await this.productModel.findByIdAndUpdate(productId, updatedData, { new: true });
            if (!updatedProduct) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.status(200).json(updatedProduct);
        } catch (error) {
            res.status(500).json({ message: 'Error updating product', error });
        }
    }

    async deleteProduct(req, res) {
        try {
            const productId = req.params.id;
            const deletedProduct = await this.productModel.findByIdAndDelete(productId);
            if (!deletedProduct) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting product', error });
        }
    }
}

module.exports = ProductController;