const express = require("express");
const router = express.Router();
const calculateRateController=require("../Rate/calculateRateController");
router.post("/Rate",calculateRateController.calculateRate)

module.exports = router;