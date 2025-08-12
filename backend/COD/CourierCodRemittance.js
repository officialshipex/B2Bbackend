const mongoose = require("mongoose");

const CourierCodRemittanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: {
    type: Date,
  },
  orderID: {
    type:Number ,
  },
  userName: {
    type: String,
  },
  PhoneNumber: {
    type: String,
  },
  Email: {
    type: String,
  },
  courierServiceName: {
    type: String,
  },
  AwbNumber: {
    type: String,
  },
  CODAmount: {
    type: Number,
  },
  status: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending",
  },
});

const CourierCodRemittance = mongoose.model(
  "CourierCodRemittance",
  CourierCodRemittanceSchema
);
module.exports = CourierCodRemittance;
