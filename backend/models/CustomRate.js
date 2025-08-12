const mongoose = require("mongoose");
const RateCard = require("./rateCards");
const User = require("./User.model");

const customRateSchema = new mongoose.Schema({
    ratecards: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RateCard"
        }
    ],
    users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

module.exports = mongoose.model("CustomRate", customRateSchema);

