const express = require('express');
const router = express.Router();

const {shipBulkOrder,updatePickup,createBulkOrder}=require("../Orders/newBulkOrders.controller")


router.post("/updatePickup",updatePickup)
router.post("/shipBulkOrder",shipBulkOrder)
router.post("/create-bulk-order",createBulkOrder);
module.exports=router
