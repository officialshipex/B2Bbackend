const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: String,
    invoiceDate: String,
    customerName: String,
    billingAddress: String,
    shippingAddress: String,
    paymentMethod: String,
    AWB: String,
    product: {
      name: String,
      sku: String,
      hsn: String,
      quantity: Number,
      unitPrice: Number,
    },
    totalAmount: Number,
  });
  
  const Invoice = mongoose.model("Invoice", invoiceSchema);