const e = require('cors');
const mongoose = require('mongoose');

const shippingRulesSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status:{
        type: Boolean,
        default: false,
    },
    ruleType: {
        type: String,
        required: true,
        enum: ['B2C order', 'B2B order', 'Document order'],
    },
    ruleName: {
        type: String,
        required: true,
        unique: true,
    },
    setPriority: {
        type: Number,
        required: true,
        unique: true,
    },
    conditionType: {
        type: String,
        required: true,
        enum: ['Match Any of the Below', 'Match All of the Below'],
    },
    conditions: [
        {
            type: {
                type: String,
                required: true,
            },
            operator: {
                type: String,
                required: true,
            },
            value: {
                type: String,
                required: true,
            },
        },
    ],
    courierPriority: [
        {
            courierName: {
                type: String,
                required: true,
            },
            priority: {
                type: Number,
                required: true,
            },
        },
    ],
});

const ShippingRules = mongoose.model('ShippingRules', shippingRulesSchema);

module.exports = ShippingRules;