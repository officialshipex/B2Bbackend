const express = require("express");
const router = express.Router();

const getBaseRateController=require("../Rate/getBaseRateController");

router.get("/",getBaseRateController.getBaseRates);
router.get("/getPlans",getBaseRateController.getPlans);

router.post("/getCouriers",getBaseRateController.getCouriers);

module.exports=router;