const express = require("express");
const router = express.Router();
const {isAuthorized}=require("../middleware/auth.middleware")
const app=express();
app.use(express.json());

const{storeAllChannelDetails,webhookhandler,getOrders,getAllChannel,getOneChannel,updateChannel,deleteChannel,fulfillOrder,fetchExistingOrders}=require("./allChannel.controller")
const {wooCommerceWebhookHandler}=require("./WooCommerce/woocommerce.controller")
router.post("/storeAllChannelDetails",isAuthorized,storeAllChannelDetails)
// ✅ Apply `express.raw()` Middleware Only for Webhook
router.post("/webhook/orders", express.raw({ type: "application/json" }), webhookhandler);
router.post("/webhook/woocommerce",express.raw({type:"application/json"}),wooCommerceWebhookHandler)
router.get("/getAllChannel",isAuthorized,getAllChannel)
router.get("/getOneChannel/:id",isAuthorized,getOneChannel)
router.put("/updateChannel/:id",isAuthorized,updateChannel)
router.delete("/delete/:id",isAuthorized,deleteChannel)
router.post("/fulfillOrder",isAuthorized,fulfillOrder)
router.post("/fetchOrder",isAuthorized,fetchExistingOrders)

router.get("/getOrders",getOrders)

module.exports=router