const express = require("express");
const router = express.Router();

const servicesController=require("../services/servicesController");

router.get("/",servicesController.getServices);

router.get("/getAllServices",servicesController.getAllServices);

module.exports=router
