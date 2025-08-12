const express = require('express');
const {
    OneStapOrderRegisteration,
    orderRegistration,
    getOrderDetails,
    createManifest,
    getShippingLabel,
    cancelOrder,
    trackOrderByTrackingID,
    trackOrderByRequestorderId,
    trackOrderByOrderReferenceId,
    getCouriers,addService} = require('../AllCouriers/SmartShip/Couriers/couriers.controller');

const  {saveSmartShip,isEnabeled,disable,enable}= require('../AllCouriers/SmartShip/Authorize/smartShip.controller');

const router = express.Router();

// router.post('/get-token',getAccessToken)
router.get("/saveNew",saveSmartShip);
router.get("/isEnabeled",isEnabeled);
router.get("/enable",enable);
router.get("/disable",disable);
router.get("/getCouriers",getCouriers);

router.post("/addService",addService);

router.post('/one-step-order-register',OneStapOrderRegisteration);
router.post('/order-register',orderRegistration);
router.post('/get-order-details',getOrderDetails);
router.post('/create-manifest',createManifest); 
router.post('/get-shipping-label',getShippingLabel);
router.post('/cancel-order',cancelOrder);
router.get('/track-by-number',trackOrderByTrackingID);
router.get('/track-by-request-id',trackOrderByRequestorderId);
router.get('/track-by-referance-id',trackOrderByOrderReferenceId);

// router.post('/hub-register',hubRegistration);
// router.post('/get-hub-details',getHubDetails);
// router.post('/delete-Hub',deleteHub);

module.exports = router;