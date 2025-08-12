const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    city:{
        type: String,
        required: true,
    },
    state:{
        type: String,
        required: true,
    },
    postalCode:{
        type: String,
        required: true,
    }
});

const BilingInfo = mongoose.model.billingInfo || mongoose.model('billingInfo',billingSchema);

module.exports = BilingInfo;