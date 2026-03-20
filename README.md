# Product Microservice

This is a simple Product Microservice built with Node.js and Express. It provides a RESTful API for managing products.

## Features

- Create, read, update, and delete products
- Error handling middleware
- Database connection setup

## Project Structure

```
product-microservice
├── src
│   ├── server.js               # Entry point of the application
│   ├── controllers             # Contains the product controller
│   │   └── productController.js
│   ├── routes                  # Contains the product routes
│   │   └── productRoutes.js
│   ├── models                  # Contains the product model
│   │   └── Product.js
│   ├── middleware              # Contains middleware functions
│   │   └── errorHandler.js
│   └── config                  # Contains configuration files
│       └── database.js
├── tests                       # Contains unit tests
│   └── product.test.js
├── package.json                # NPM configuration file
└── README.md                   # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd product-microservice
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

1. Start the server:
   ```
   npm start
   ```
2. The API will be available at `http://localhost:3000`.

## API Endpoints

- `POST /products` - Create a new product
- `GET /products/:id` - Retrieve a product by ID
- `PUT /products/:id` - Update a product by ID
- `DELETE /products/:id` - Delete a product by ID

## Testing

To run the tests, use the following command:
```
npm test
```

## Distributed Cluster (Election Algorithms)

This microservice now supports running in a highly available, decentralized cluster using Leader Election algorithms (such as the **Bully Algorithm**). The cluster forms a P2P network where instances elect a leader automatically to handle write operations, while replicas handle read operations. Failover is fully automatic.

All distributed systems scripts are located in the `distribuited-systems/` directory.

To run the cluster and test the automatic failover, please refer to the detailed documentation located at:
- [`RODAR_CLUSTER_BULLY.md`](./RODAR_CLUSTER_BULLY.md)

## License

This project is licensed under the MIT License.