// orderSchema.js
const mongoose = require('mongoose');

const bulkOrderCSVSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BulkOrderFiles',
    required: true,
  },
  orderId: { type: String, required: true, unique: true },
  orderDate: { type:Date },
  channel: { type: String, required: true },
  paymentMethod: { type: String, required: true, enum: ['COD', 'Prepaid'] },
  customer: {
    firstName: { type: String, required: true },
    lastName: { type:String, },
    email: { type:String, },
    mobile: { type: String, required: true },
    alternateMobile: { type:String, },
  },
  shippingAddress: {
    line1: { type: String, required: true },
    line2: { type:String, },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    postcode: { type: String, required: true }
  },
  billingAddress: {
    line1: { type:String, },
    line2: { type:String, },
    country: { type:String, },
    state: { type:String, },
    city:{ type:String, },
    postcode:{ type:String, },
  },
  orderDetails: {
    masterSKU: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    taxPercentage: { type:Number, default: 0 },
    sellingPrice: { type: Number, required: true },
    discount:{ type:Number, default: 0 },
    shippingCharges: { type:Number, default: 0 },
    codCharges: { type:Number, default: 0 },
    giftWrapCharges:{ type:Number, default: 0 },
    totalDiscount: { type:Number, default: 0 },
    dimensions: {
      length: { type: Number, required: true },
      breadth: { type: Number, required: true },
      height: { type: Number, required: true }
    },
    weight: { type: Number, required: true },
  },
  sendNotification: {type:Boolean,},
  comment: { type:String, },
  hsnCode: { type:String, },
  locationId: { type:String, },
  resellerName: { type:String, },
  companyName: { type:String, },
  latitude: { type:Number},
  longitude: { type:Number},
  verifiedOrder:{ type:Boolean },
  isDocuments: { type: String, enum: ['Yes', 'No'] },
  orderType: { type:String, },
  orderTag: { type:String, },
});

module.exports = mongoose.model('bulkOrdersCSV', bulkOrderCSVSchema);