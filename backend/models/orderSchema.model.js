const mongoose = require('mongoose');
const CourierSecond = require("./courierSecond");
const CourierServiceSecond = require("./courierServiceSecond.model");
const User = require("./User.model");
const Warehouse = require("./wareHouse.model");

const orderSchema = new mongoose.Schema({
    order_id: {
        type: String,
        required: true,
        unique: true
    },
    order_type: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    orderCategory: {
        type: String,
        enum: ['B2C-forward', 'B2C-reverse', 'B2C-reverse-QC', 'B2B'],
        required: true
    },
    shipping_details: {
        firstName: { type: String, required: true },
        lastName: { type: String },
        companyName: { type: String },
        address: { type: String, required: true },
        address2: { type: String },
        pinCode: { type: Number, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        phone: { type: Number, required: true },
        email: { type: String, required: true }
    },
    Biling_details: {
        firstName: { type: String, required: true },
        lastName: { type: String },
        companyName: { type: String },
        address: { type: String, required: true },
        address2: { type: String },
        pinCode: { type: Number, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        phone: { type: Number, required: true },
        email: { type: String, required: true },
        gstNumber: { type: String, default: "" },
    },
    Product_details: {
        type: Array,
        required: true
    },

    shipping_cost: {
        weight: String,
        dimensions: {
            length: String,
            width: String,
            height: String
        },
        volumetricWeight: Number,
        shippingCharges: Number,
        codCharges: Number,
        taxAmount: Number,
        discount: Number,
        collectableAmount: Number
    },

    sub_total: {
        type: Number,
        min: 0
    },
    status: {
        type: String,
        enum: ['Not-Shipped', 'Booked', 'Pending', 'Cancelled', 'Fulfilled', 'WaitingPickup'],
        required: true
    },
    cancelledAtStage: {
        type: String,
        enum: ['Booked', 'Not-Shipped', 'Pending'],
        default: null
    },
    service_details: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourierServiceSecond'
    },

    order_shipped_date: {
        type: Date
    },
    awb_number: {
        type: String
    },
    shipment_id: {
        type: String
    },
    shipping_is_billing: {
        type: Boolean,
        default: false
    },

    pickup_details: {
        pickup_scheduled_date: {
            type: String
        },
        pickup_token_number: {
            type: String
        },
        pickup_generated_date: {
            type: String
        },
        pickup_time: {
            type: String
        }
    },
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse'
    },
    freightCharges:{
        type:Number
    },
    tracking: [
        {
            stage: { type: String, required: true },
            timestamp: { type: mongoose.Schema.Types.Mixed, default: Date.now },
        },
    ],

}, {
    timestamps: true
});

// Indexing for performance
// orderSchema.index({ order_id: 1, user: 1 });
// orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
