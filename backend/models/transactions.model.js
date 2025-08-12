const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  customerId: { type: String, required: true },
  amount: { type: String, required: true },
  status: { type: String, required: true },
  transactionId: { type: String },
  createdAt: { type: Date, default: Date.now },
  checksumHash:{type:String,required:true}
});

module.exports = mongoose.model("Transaction", transactionSchema);
