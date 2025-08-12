const express = require("express");
const router = express.Router();
const {kycdata, getAadhaar, getPan, getBankAccount, getGST, getAddress,getBillingInfo } = require("./getKyc.controller");



router.get("/kycdata",kycdata)
router.get("/getAadhaar",getAadhaar);
router.get("/getPan",getPan)
router.get("/getBankAccount",getBankAccount)
router.get("/getGST",getGST)
router.get("/getAddress",getAddress)
router.get("/getBillingInfo",getBillingInfo)


module.exports=router;
