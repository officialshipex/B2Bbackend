const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: Number,
      required: true,
    },
    channelId: {
      type: Number,
    },
    pickupAddress: {
      contactName: { type: String, required: true },
      email: { type: String },
      phoneNumber: { type: String, required: true },
      address: { type: String, required: true },
      pinCode: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
    },
    receiverAddress: {
      contactName: { type: String, required: true },
      email: { type: String },
      phoneNumber: { type: String, required: true },
      address: { type: String, required: true },
      pinCode: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
    },
    productDetails: [
      {
        id: { type: Number, required: true },
        quantity: { type: Number, required: true },
        name: { type: String, required: true },
        sku: { type: String },
        unitPrice: { type: String, required: true },
      },
    ],
    packageDetails: [
      {
        deadWeight: { type: Number, required: true },
        noOfBox: { type: Number, default: 0 },
        weightPerBox: { type: Number, default: 0 },
        applicableWeight: { type: Number, required: true },
        volumetricWeight: {
          length: { type: Number, required: true },
          width: { type: Number, required: true },
          height: { type: Number, required: true },
          calculatedWeight: { type: Number }, // Calculated volumetric weight
        },
      },
    ],
    applicableWeight: {
      type: Number,
      required: true,
    },
    compositeOrderId: {
      type: String,
      unique: true,
    },
    zone: { type: String },
    paymentDetails: {
      method: { type: String, enum: ["COD", "Prepaid"], required: true },
      amount: {
        type: Number,
        required: function () {
          return this.paymentDetails?.method === "Prepaid";
        },
      },
      default: {},
    },
    ndrHistory: { type: Array, default: [] },
    ndrReason: {
      date: { type: Date },
      reason: { type: String },
    },
    awb_number: {
      type: String,
    },
    label: {
      type: String,
    },
    shipment_id: {
      type: String,
    },
    provider: {
      type: String,
    },
    totalFreightCharges: {
      type: Number,
    },
    status: { type: String, required: true },
    ndrStatus: { type: String },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    shipmentCreatedAt: { type: Date },
    courierServiceName: {
      type: String,
    },
    RTOCharges: { type: String },
    COD: { type: String },
    reattempt: { type: Boolean },
    commodityId: { type: Number },
    tracking: [
      {
        status: { type: String },
        StatusLocation: { type: String },
        StatusDateTime: { type: Date },
        Instructions: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Compound index
orderSchema.index({ userId: 1, createdAt: -1 });

const Order = mongoose.model('newOrder', orderSchema)

module.exports = Order;