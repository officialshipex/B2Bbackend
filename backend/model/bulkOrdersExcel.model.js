const mongoose = require('mongoose');

const bulkOrdersExcelSchema = new mongoose.Schema({
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BulkOrderFiles',
        required: true,
    },
    orderId: {
        type: String,
        required: true,
    },
    orderDate:{
        type:Date,
    },
    verifiedOrder:{
        type:String,
    },
    buyer:{
        mobileNo:{
            type:Number,
            required:true,
        },
        firstName:{
            type:String,
            required:true,
        },
        lastName:{
            type:String,
        },
        email:{
            type:String,
        },
        alternatePhone:{
            type:String,
        },
        companyName:{
            type:String,
        },
        gstin:{
            type:String,
        },
    },
    shippingAddress:{
        completeAddress:{
            type:String,
            required:true,
        },
        landmark:{
            type:String,
        },
        pincode:{
            type:Number,
            required:true,
        },
        city:{
            type:String,
            required:true,
        },
        state:{
            type:String,
            required:true,
        },
        country:{
            type:String,
            required:true,
        },
    },
    billingAddress:{
        completeAddress:{
            type:String,
        },
        landmark:{
            type:String,
        },
        pincode:{
            type:Number,
        },
        city:{
            type:String,
        },
        state:{
            type:String,
        },
        country:{
            type:String,
        },
    },
    orderDetails:{
        orderChannel:{
            type:String,
            required:true,
        },
        paymentMethod:{
            type:String,
            required:true,
        },
        productName:{
            type:String,
            required:true,
        },
        masterSKU:{
            type:String,
            required:true,
        },
        quantity:{
            type:Number,
            required:true,
        },
        unitPrice:{
            type:Number,
            required:true,
        },
        productDiscount:{
            type:Number,
        },
        hsnCode:{
            type:Number,
        },
        taxRate:{
            type:Number,
        },
        shippingCharges:{
            type:Number,
        },
        giftWrapCharges:{
            type:Number,
        },
        transactionFee:{
            type:Number,
        },
        totalDiscount:{
            type:Number,
        },
        orderTag:{
            type:String,
        },
        containDocuments:{
            type:Boolean,
            required:true,
        },
        resellerName:{
            type:String,
        }
    },
    packageDetails:{
        weight:{
            type:Number,
            required:true,
        },
        length:{
            type:Number,
            required:true,
        },
        breadth:{
            type:Number,
            required:true,
        },
        height:{
            type:Number,
            required:true,
        },
    },
    courierID:{
        type:Number,
    },
    sendNotification:{
        type:String,
    },
    pickupAddressId:{
        type:Number,
    },
    status: {
        type: String,
        enum: ['Pending', 'Processed', 'Shipped', 'Completed'],
        default: 'Pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const bulkOrdersExcel = mongoose.model('bulkOrdersExcel', bulkOrdersExcelSchema);
module.exports = bulkOrdersExcel;
