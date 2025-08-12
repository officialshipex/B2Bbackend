const Product = require("../model/CreateNewProduct.model");

// Controller to create a new product
exports.createProduct = async (req, res) => {
  try {
    const {
      productName,
      storeSKU,
      price,
      hsnCode,
      taxRate,
      weight,
      length,
      breadth,
      height,
    } = req.body;

    // Validate the required fields
    if (
      !productName ||
      !storeSKU ||
      !price ||
      !hsnCode ||
      !taxRate ||
      !weight ||
      !length ||
      !breadth ||
      !height
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create a new product
    const product = new Product({
      productName,
      storeSKU,
      price,
      hsnCode,
      taxRate,
      weight,
      length,
      breadth,
      height,
    });

    await product.save();
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Controller to get all products
// exports.getAllProducts = async (req, res) => {
//   try {
//     const products = await Product.find();
//     res.status(200).json(products);
//   } catch (error) {
//     console.error("Error fetching products:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// Controller to get a single product by ID
// exports.getProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }
//     res.status(200).json(product);
//   } catch (error) {
//     console.error("Error fetching product by ID:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// Controller to update a product
// exports.updateProduct = async (req, res) => {
//   try {
//     const productId = req.params.id;
//     const updates = req.body;

//     // Validate updates
//     if (!Object.keys(updates).length) {
//       return res.status(400).json({ message: "No updates provided" });
//     }

//     const updatedProduct = await Product.findByIdAndUpdate(productId, updates, {
//       new: true,
//       runValidators: true, // Ensure validation is applied during the update
//     });

//     if (!updatedProduct) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     res.status(200).json({ message: "Product updated successfully", updatedProduct });
//   } catch (error) {
//     console.error("Error updating product:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// Controller to delete a product
// exports.deleteProduct = async (req, res) => {
//   try {
//     const productId = req.params.id;
//     const deletedProduct = await Product.findByIdAndDelete(productId);

//     if (!deletedProduct) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     res.status(200).json({ message: "Product deleted successfully", deletedProduct });
//   } catch (error) {
//     console.error("Error deleting product:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };
