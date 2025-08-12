const { createOrder,razorpayWebhook,getWalletHistoryByUserId,getWalletBalanceAndHoldAmount} = require("./recharge.controller");
const express = require("express");
const rechargeRouter = express.Router();
const {isAuthorized}=require("../middleware/auth.middleware")
// const {getAllTransactionHistory,addWalletHistory}=require("../Admin/Billings/walletHistory")

// -----------PHONE PAY-------------------------------------------------------
// rechargeRouter.post("/phonepe", phonePe);

// rechargeRouter.post('/redirect-url/:merchantTransactionId',(req,res)=>{
//     const { merchantTransactionId } = req.params
//     console.log('merchantTransactionId',merchantTransactionId)
//     if(merchantTransactionId){
//         res.send({merchantTransactionId})
//     }else{
//         res.send({error:'error'})
//     }
// })

// ---------------CASHFREE----------------------------------------------

//=============Razorpay============
rechargeRouter.post("/create-order",isAuthorized,createOrder)
rechargeRouter.post("/razorpay-webhook", express.json({ verify: (req, res, buf) => { req.rawBody = buf } }), razorpayWebhook);
rechargeRouter.get("/transactionHistory",isAuthorized,getWalletHistoryByUserId);
rechargeRouter.get("/getWalletBalanceAndHoldAmount",isAuthorized,getWalletBalanceAndHoldAmount)

//==============Razorpay================
// rechargeRouter.post('/recharge',handlePaymentOrder);
// rechargeRouter.post('/createorder',RazorpayOrder);
// rechargeRouter.get('/p*ayment/:orderId/:walletId',handlePaymentRequest);

module.exports = rechargeRouter;