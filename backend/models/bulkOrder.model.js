const mongoose = require("mongoose");

const bulkOrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    paymentType: { type: String, required: true },
    shippingCustomerFirstName: { type: String, required: true },
    shippingCustomerLastName: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    landmark: { type: String, required: true },
    customerPhoneNumber: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    billingInformation: { type: String }, // Optional
    weightInGrams: { type: Number, required: true },
    dimensions: {
      length: { type: Number, required: true },
      height: { type: Number, required: true },
      breadth: { type: Number, required: true },
    },
    shippingCharges: { type: Number, required: true },
    codCharges: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    discount: { type: Number, required: true },
    sku: { type: String, required: true },
    productDetails: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("bulkOrderUpload", bulkOrderSchema);
