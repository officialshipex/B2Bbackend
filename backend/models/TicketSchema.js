const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  awbType: { type: String, enum: ["single", "multiple"], required: false }, // not required
  awbNumbers: [{
    type: String,
    required: false // not required
  }],
  ticketNumber: { type: String, unique: true, required: true },
  file: { type: String }, // legacy, keep for compatibility
  attachments: [{ type: String }], // new: array of file/image paths
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },

  // User details
  fullname: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  userId: { type: String, required: true },
  email: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  company: { type: String, required: true },

  // Status field
  status: {
    type: String,
    enum: ["active", "resolved", "deleted"],
    default: "active"
  }
});

const Ticket = mongoose.model("Ticket", ticketSchema);
module.exports = Ticket;