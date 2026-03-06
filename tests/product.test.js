const request = require('supertest');
const app = require('../src/server'); // Adjust the path as necessary
const Product = require('../src/models/Product');

describe('Product API', () => {
    beforeAll(async () => {
        // Setup code to connect to the database and clear the Product collection
    });

    afterAll(async () => {
        // Cleanup code to disconnect from the database
    });

    it('should create a new product', async () => {
        const newProduct = {
            name: 'Test Product',
            price: 100,
            description: 'This is a test product'
        };

        const response = await request(app)
            .post('/api/products') // Adjust the route as necessary
            .send(newProduct)
            .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(newProduct.name);
    });

    it('should get a product by ID', async () => {
        const productId = 'someProductId'; // Replace with a valid product ID

        const response = await request(app)
            .get(`/api/products/${productId}`) // Adjust the route as necessary
            .expect(200);

        expect(response.body).toHaveProperty('id', productId);
    });

    it('should update a product', async () => {
        const productId = 'someProductId'; // Replace with a valid product ID
        const updatedProduct = {
            name: 'Updated Product',
            price: 150,
            description: 'This is an updated test product'
        };

        const response = await request(app)
            .put(`/api/products/${productId}`) // Adjust the route as necessary
            .send(updatedProduct)
            .expect(200);

        expect(response.body.name).toBe(updatedProduct.name);
    });

    it('should delete a product', async () => {
        const productId = 'someProductId'; // Replace with a valid product ID

        await request(app)
            .delete(`/api/products/${productId}`) // Adjust the route as necessary
            .expect(204);
    });
});