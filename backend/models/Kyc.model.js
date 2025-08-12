const mongoose = require("mongoose");

const KycSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    companyCategory: {
      type: String,
      default: "individual",
      enum: ["individual", "company"],
    },
    companyName: {
      type: String,
    },
    gstNumber: {
      type: String,
      unique: true,
      sparse: true, // ✅ Allows multiple `null` values
    },
    address: {
      addressLine1: String,
      addressLine2: String,
      pinCode: String,
      city: String,
      state: String,
      country: String,
    },
    kycType: {
      type: String,
      enum: ["digital", "manual"],
    },
    // aadhaarNumber: {
    //   type: String,
    //   unique: true,
    //   sparse: true, // ✅ Allows multiple `null` values
    // },
    panNumber: {
      type: String,
      unique: true,
      sparse: true, // ✅ Allows multiple `null` values
    },
    panName: {
      type: String,
    },
    accountNumber: {
      type: String,
      unique: true,
      sparse: true, // ✅ Allows multiple `null` values
    },
    ifscCode: {
      type: String,
    },
    accountHolderName: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    isVerified: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

const Kyc = mongoose.model("Kyc", KycSchema);

module.exports = Kyc;
