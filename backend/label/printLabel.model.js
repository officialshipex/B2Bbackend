const mongoose = require("mongoose");

// Define the Order schema
const OrderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  address: { type: String, required: true },
  mobile: { type: String, required: true },
  orderDate: { type: String, required: true },
  invoiceNo: { type: String, required: true },
  amount: { type: Number, required: true },
  weight: { type: String, required: true },
  dimensions: { type: String, required: true },
  sku: { type: String, required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  pickupAddress: { type: String, required: true },
  pickupMobile: { type: String, required: true },
});

// Export the Order model
const Order = mongoose.model("printLabel", OrderSchema);
module.exports = Order;
