
const express = require("express");
const router = express.Router();

const shiprocketAuthorize = require("../AllCouriers/ShipRocket/Authorize/shiprocket.controller");
const { createShiprocketCargoOrder, calculateShiprocketCargoCharges, getShiprocketCargoOrderDetails, getShiprocketCargoTracking, calculateShiprocketCharges, cancelShiprocketOrder } = require("../AllCouriers/ShipRocket/MainServices/mainServices.controller");
const { isAuthorized } = require("../middleware/auth.middleware");



router.post('/createShipment', createShiprocketCargoOrder)
router.post('/authorize', shiprocketAuthorize.getShiprocketAuthentiation);
router.get('/calculateShiprocketCargoCharges/:id', isAuthorized, calculateShiprocketCargoCharges);
router.post('/calculateShiprocketCharges', isAuthorized, calculateShiprocketCharges);
router.get('/getOrderDetails/:shipment_id', getShiprocketCargoOrderDetails);
router.get('/getCargoTracking/:waybill_no',getShiprocketCargoTracking)
router.post('/cancelShiprocketOrder', isAuthorized, cancelShiprocketOrder);

module.exports = router
