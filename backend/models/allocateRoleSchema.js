const mongoose = require("mongoose");

const allocateRoleSchema = new mongoose.Schema({
  sellerId: { type: String, required: true }, // userId (custom field)
  sellerMongoId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" }, // MongoDB _id
  sellerName: { type: String, required: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  allocatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AllocatedRole", allocateRoleSchema);