const mongoose = require("mongoose");
const RateCard = require('./rateCards');

const courierServiceSecondSchema = new mongoose.Schema(
  {
    courierProviderServiceId: {
      type: String,
      required: true,
    },
    courierProviderServiceName: {
      type: String,
      required: true,
    },
    rateCards: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RateCard',
    }],
    
    isEnabeled:{
      type:Boolean,
      default:true
    },
    mode:{
      type:String,
    }
  },
  {
    timestamps: true,
  }
);

const CourierServiceSecond= mongoose.model("CourierServiceSecond", courierServiceSecondSchema);
module.exports = CourierServiceSecond;