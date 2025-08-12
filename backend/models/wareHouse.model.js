const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  warehouseName: {
    type: String,
    required: true,
    unique: true
  },
  contactName: {
    type: String,
    required: true,
  },
  contactNo: {
    type: String,
    required: true,
  },
  addressLine1: {
    type: String,
    required: true,
  },
  addressLine2: {
    type: String,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  pinCode: {
    type: String,
    required: true,
  },
  gstNumber: {
    type: String,
    required: true,
  },
  supportEmail: {
    type: String,
  },
  supportPhone: {
    type: String,
  },
//   hideAddress: {
//     type: Boolean,
//     default: false,
//   },
//   hideMobileNumber: {
//     type: Boolean,
//     default: false,
//   },
//   hideProductDetails: {
//     type: Boolean,
//     default: false,
//   },
//   hideCompanyName: {
//     type: Boolean,
//     default: false,
//   },
//   hideGSTNumber: {
//     type: Boolean,
//     default: false,
//   },
}, { timestamps: true });

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

module.exports = Warehouse;