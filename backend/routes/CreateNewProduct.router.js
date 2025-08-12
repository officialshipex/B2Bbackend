const express = require("express");
const {
  createProduct,
//   getAllProducts,
//   getProductById,
//   updateProduct,
//   deleteProduct,
} = require("../Orders/CreateNewProduct.controller");

const router = express.Router();

// Routes
router.post("/", createProduct); // Create a new product
// router.get("/", getAllProducts); // Get all products
// router.get("/:id", getProductById); // Get a product by ID
// router.put("/:id", updateProduct); // Update a product
// router.delete("/:id", deleteProduct); // Delete a product

module.exports = router;
