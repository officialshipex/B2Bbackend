const express = require("express");
const router = express.Router();

const wareHouseController=require("../WareHouse/warehouse.controller");

router.post("/createWareHouse",wareHouseController.createWareHouse);

module.exports=router;
