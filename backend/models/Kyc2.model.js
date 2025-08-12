const mongoose = require("mongoose");

const Kyc2Schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  companyDetails: {
    companyName: { type: String, default: "" },
    sellerName: { type: String, default: "" },
    primaryEmail: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    brandName: { type: String, default: "" },
    website: { type: String, default: "" },
    supportContact: { type: String, default: "" },
    supportEmail: { type: String, default: "" },
    operationsEmail: { type: String, default: "" },
    financeEmail: { type: String, default: "" },
  },
  primaryAddress: {
    contactPersonName: { type: String, default: "" },
    contactPersonEmail: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    addressLineOne: { type: String, default: "" },
    addressLineTwo: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    sameAsBilling: { type: Boolean, default: false },
  },
  accountDetails: {
    accountHolderName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
  },
  isVerified: { type: Boolean, default: false },
  companyCategory: { type: String, default: "" },
  panNumber: { type: String, default: "" },
  panHolderName: { type: String, default: "" },
  gstNumber: { type: String, default: "" },
  gstCompanyName: { type: String, default: "" },
  aadhaarNumber: { type: String, default: "" },
  aadhaarOtp: { type: String, default: "" },
  refId: { type: String, default: "" },
  isAadhaarOtpSent: { type: Boolean, default: false },
  verificationState: {
    isPanVerified: { type: Boolean, default: false },
    isGstVerified: { type: Boolean, default: false },
    isAadhaarOtpSent: { type: Boolean, default: false },
    isAadhaarVerified: { type: Boolean, default: false },
  },
});

module.exports = mongoose.model("Kyc2", Kyc2Schema);
