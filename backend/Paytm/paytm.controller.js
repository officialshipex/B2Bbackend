if(process.env.NODE_ENV!="production"){
  require('dotenv').config();
  }

const formidable = require("formidable");
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const https = require("https");
// const firebase = require("firebase");
const PaytmChecksum = require("../utils/checkSum");

const paytmCallback = (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, (err, fields, file) => {
    const paytmChecksum = fields.CHECKSUMHASH;
    delete fields.CHECKSUMHASH;

    const isVerifySignature = PaytmChecksum.verifySignature(
      fields,
      process.env.PAYTM_MERCHANT_KEY,
      paytmChecksum
    );

    if (isVerifySignature) {
      const paytmParams = {
        MID: fields.MID,
        ORDERID: fields.ORDERID,
      };

      PaytmChecksum.generateSignature(
        paytmParams,
        process.env.PAYTM_MERCHANT_KEY
      ).then(checksum => {
        paytmParams["CHECKSUMHASH"] = checksum;

        const post_data = JSON.stringify(paytmParams);

        const options = {
          hostname: "securegw-stage.paytm.in",
          port: 443,
          path: "/order/status",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": post_data.length,
          },
        };

        let response = "";
        const post_req = https.request(options, post_res => {
          post_res.on("data", chunk => {
            response += chunk;
          });

          post_res.on("end", () => {
            const result = JSON.parse(response);
            if (result.STATUS === "TXN_SUCCESS") {
              // Handle success, e.g., store transaction details
              res.json({ status: "success", result });
            } else {
              res.json({ status: "failure", result });
            }
          });
        });

        post_req.write(post_data);
        post_req.end();
      });
    } else {
      res.json({ status: "Checksum Mismatched" });
    }
  });
};




// router.post("/payment", (req, res) => {
const initiatePayment = (req, res) => {
  const { amount, email } = req.body;
  

  /* import checksum generation utility */
  const totalAmount = JSON.stringify(amount);
  var params = {};

  /* initialize an array */
  (params["MID"] = process.env.PAYTM_MID),
    (params["WEBSITE"] = process.env.PAYTM_WEBSITE),
    (params["CHANNEL_ID"] = process.env.PAYTM_CHANNEL_ID),
    (params["INDUSTRY_TYPE_ID"] = process.env.PAYTM_INDUSTRY_TYPE_ID),
    (params["ORDER_ID"] = uuidv4()),
    (params["CUST_ID"] = process.env.PAYTM_CUST_ID),
    (params["TXN_AMOUNT"] = totalAmount),
    (params["CALLBACK_URL"] = "http://localhost:5000/v1/paytm/callback"),
    (params["EMAIL"] = email),
    (params["MOBILE_NO"] = "7828153133");

  /**
   * Generate checksum by parameters we have
   * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
   */
  var paytmChecksum = PaytmChecksum.generateSignature(
    params,
    process.env.PAYTM_MERCHANT_KEY
  );
  paytmChecksum
    .then(function (checksum) {
      let paytmParams = {
        ...params,
        CHECKSUMHASH: checksum,
      };
      res.json(paytmParams);
    })
    .catch(function (error) {
      console.log(error);
    });
};

module.exports={initiatePayment,paytmCallback}
