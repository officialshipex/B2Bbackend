const mongoose = require("mongoose");

const codRemittanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  CODToBeRemitted: { type: Number },
  LastCODRemitted: { type: Number },
  TotalCODRemitted: { type: Number },
  TotalDeductionfromCOD: { type: Number },
  RemittanceInitiated: { type: Number,defult:0 },
  rechargeAmount:{type:Number},

  remittanceData: [
    {
      date: { type: Date },
      remittanceId: { type: String},
      utr: { type: String },
      codAvailable: { type: Number },
      amountCreditedToWallet: { type: Number, },
      earlyCodCharges: { type: Number, default: 0 },
      adjustedAmount: { type: Number },
      remittanceMethod: {
        type: String,
      },
      status: {
        type: String,
        enum: ["Pending", "Paid"],
        default: "Pending",
      },
      orderDetails: {
            date: { type: Date},
            codcal: { type: Number },
            orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
          },
    },
  ],
});
const CODRemittance = mongoose.model("CODRemittance", codRemittanceSchema);

module.exports = CODRemittance;
