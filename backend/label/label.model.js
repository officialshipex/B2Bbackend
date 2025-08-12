const { required } = require('joi');
const mongoose = require('mongoose');

const labelSettingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    labelType: {
        type: String,
        required: true,
        enum: ['A4', 'Thermal'],
        default: 'A4',
    },
    labelSize: {
        type: String,
        required: true,
        enum: ['4x6', '8x11'],
        default: '4x6',
    },
    commonSetting: {
        showLogo: {
            type: Boolean,
            default: false,
        },
        picture: {
            type: String,
            required: false,
        },
        useChannelLogo: {
            type: Boolean,
            default: false,
        },
        showSupportInfo: {
            type: Boolean,
            default: false,
        },
        supportEmail: {
            type: String,
            required: false,
        },
        supportPhone: {
            type: String,
            required: false,
        },
        useWarehouseSupportInfo: {
            type: Boolean,
            default: false,
        },
    },
    customerSetting: {
        hidePhoneNumber: {
            type: Boolean,
            default: false,
        },
        hideOrderBarcode: {
            type: Boolean,
            default: false,
        }
    },
    wareHouseSetting: {
        hidePickupAddress: {
            type: Boolean,
            default: false,
        },
        hideRtoAddress: {
            type: Boolean,
            default: false,
        },
        hideGstNumber: {
            type: Boolean,
            default: false,
        },
        hidePickupPhoneNumber: {
            type: Boolean,
            default: false,
        },
        hideRtoPhoneNumber: {
            type: Boolean,
            default: false,
        },
        hidePickupContactName: {
            type: Boolean,
            default: false,
        },
        hideRtoContactName: {
            type: Boolean,
            default: false,
        },
    },
    productDetails: {
        hideSKU: {
            type: Boolean,
            default: false,
        },
        hideProduct: {
            type: Boolean,
            default: false,
        },
        hideQTY: {
            type: Boolean,
            default: false,
        },
        hideTotalAmount: {
            type: Boolean,
            default: false,
        },
        hideDiscountAmount: {
            type: Boolean,
            default: false,
        },
        showGst: {
            type: Boolean,
            default: false,
        },
        trimSkuUpto: {
            type: Number,
            default: null,
        },
        trimProductNameUpto: {
            type: Number,
            default: null,
        },
    }
})

const LabelSetting = mongoose.model.LabelSetting || mongoose.model('labelSetting', labelSettingSchema);

module.exports = LabelSetting;