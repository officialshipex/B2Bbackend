const express = require("express");
const router = express.Router();

const CouriesController=require("../services/couriers.Controller");

router.get("/getAllCouriers",CouriesController.getCouriers);

module.exports=router;