const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    storeSKU: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    hsnCode: { type: String, required: true },
    taxRate: { type: Number, required: true },
    weight: { type: Number, required: true },
    length: { type: Number, required: true },
    breadth: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { timestamps: true } 
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
