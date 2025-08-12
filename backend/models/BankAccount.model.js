const mongoose = require('mongoose');

const BankAccountSchema = new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    ifsc :{
        type: String,
        required: true,
    },
    AccountStatus:{
        type: String,
        // required: true,
    },
    nameAtBank:{
        type: String,
        // required: true,
    },
    bank:{
        type: String,
        // required: true,
    },
    branch:{
        type: String,
        // required: true,
    },
    city:{
        type: String,
        // required: true,
    },
    nameMatchResult:{
        type: String,
    },
})

const BankAccount = mongoose.model('BankAccount', BankAccountSchema);

module.exports = BankAccount;