const mongoose = require('mongoose');

const panSchema = new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    nameProvided: {
        type: String,
        required: true,
    },
    pan : {
        type: String,
        required: true,
        unique: true,
    },
    registeredName : {
        type: String,
        required: true,
    },
    panType : {
        type: String,
        required: true,
    },
    panRefId : {
        type: String,
        required: true,
    },
});

const Pan = mongoose.model.Pan || mongoose.model('pan',panSchema);

module.exports = Pan;