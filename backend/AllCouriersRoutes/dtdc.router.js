const express = require('express');
const { saveDtdc, getToken } = require('../AllCouriers/DTDC/Authorize/saveCourierContoller');
const { createOrder, cancelOrder, cancelOrderDTDC } = require('../AllCouriers/DTDC/Courier/couriers.controller');
const router = express.Router()



router.post('/getToken', getToken )
router.get('/saveNew',saveDtdc);
router.post('/createShipment', createOrder)
router.post('/cancelOrderDTDC',cancelOrderDTDC)

module.exports = router;