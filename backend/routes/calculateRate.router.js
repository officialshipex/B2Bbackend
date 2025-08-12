const express = require("express");
const router = express.Router();
const calculateRateController=require("../Rate/calculateRateController");

router.post("/b2c",calculateRateController.calculateRate);

module.exports=router
