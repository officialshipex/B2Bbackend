const axios = require("axios");
const Order = require("../../../models/newOrder.model");
const Wallet = require("../../../models/wallet");
const { getAmazonAccessToken } = require("../Authorize/saveCourierController");
const User = require("../../../models/User.model");
const { s3 } = require("../../../config/s3");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { checkAmazonServiceability } = require("./couriers.controller");
const { getZone } = require("../../../Rate/zoneManagementController");

const createShipmentAmazon = async (
  serviceDetails,
  orderId,
  wh,
  walletId,
  charges
) => {
  try {
    const accessToken = await getAmazonAccessToken();
    if (!accessToken) {
      return { success: false, message: "Access token missing" };
    }

    const currentOrder = await Order.findById(orderId);
    if (!currentOrder) {
      return { success: false, message: "Order not found" };
    }
    const zone = await getZone(
      currentOrder.pickupAddress.pinCode,
      currentOrder.receiverAddress.pinCode
      // res
    );
    if (!zone) {
      return res.status(400).json({ message: "Pincode not serviceable" });
    }

    const currentWallet = await Wallet.findById(walletId);
    if (!currentWallet) {
      return { success: false, message: "Wallet not found" };
    }

    const holdAmount = currentWallet?.holdAmount || 0;
    const availableBalance = currentWallet.balance - holdAmount;

    if (availableBalance < charges) {
      return {
        success: false,
        message: "Insufficient wallet balance after hold deduction",
      };
    }

    const weight = currentOrder.packageDetails?.applicableWeight * 1000;

    const payload = {
      origin: currentOrder.pickupAddress,
      destination: currentOrder.receiverAddress,
      payment_type: currentOrder.paymentDetails?.method,
      order_amount: currentOrder.paymentDetails?.amount || 0,
      weight: weight || 0,
      length: currentOrder.packageDetails.volumetricWeight?.length || 0,
      breadth: currentOrder.packageDetails.volumetricWeight?.width || 0,
      height: currentOrder.packageDetails.volumetricWeight?.height || 0,
      productDetails: currentOrder.productDetails,
      orderId: currentOrder.orderId,
    };

    const { rate, requestToken, valueAddedServiceIds } =
      await checkAmazonServiceability("Amazon", payload);

    const isCOD = payload.payment_type === "COD";

    const shipmentData = {
      requestToken,
      rateId: rate,
      requestedDocumentSpecification: {
        format: "PDF",
        size: { width: 4.0, length: 6.0, unit: "INCH" },
        dpi: 300,
        pageLayout: "DEFAULT",
        needFileJoining: false,
        requestedDocumentTypes: ["LABEL"],
      },
      requestedValueAddedServices: isCOD ? [{ id: "CollectOnDelivery" }] : [],
    };

    const response = await axios.post(
      "https://sellingpartnerapi-eu.amazon.com/shipping/v2/shipments",
      shipmentData,
      {
        headers: {
          "x-amz-access-token": accessToken,
          "x-amzn-shipping-business-id": "AmazonShipping_IN",
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data?.payload;
    console.log("resulttttttttreress", result);
    if (!result) {
      return {
        success: false,
        message: "Error creating shipment",
        error: response.data,
      };
    }

    const trackingId = result.packageDocumentDetails[0].trackingId;
    console.log("tracking", trackingId);
    const base64Label =
      result.packageDocumentDetails[0].packageDocuments[0].contents;
    const labelBuffer = Buffer.from(base64Label, "base64");
    const labelKey = `labels/${Date.now()}_${
      currentOrder.orderId || "label"
    }.pdf`;

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: labelKey,
      Body: labelBuffer,
      ContentType: "application/pdf",
    });

    await s3.send(uploadCommand);

    const labelUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${labelKey}`;

    // Update Order
    currentOrder.status = "Ready To Ship";
    currentOrder.cancelledAtStage = null;
    currentOrder.awb_number = result.packageDocumentDetails[0].trackingId;
    currentOrder.shipment_id = `${result.shipmentId}`;
    currentOrder.provider = "Amazon";
    currentOrder.totalFreightCharges = charges;
    currentOrder.courierServiceName = serviceDetails.courierServiceName;
    currentOrder.shipmentCreatedAt = new Date();
    currentOrder.label = labelUrl;
    currentOrder.zone=zone.zone;

    await currentOrder.save();

    // Update Wallet with atomic deduction
    const updatedWallet = await Wallet.findOneAndUpdate(
      { _id: walletId, balance: { $gte: charges } }, // Ensure sufficient balance
      [
        {
          $set: {
            balance: { $subtract: ["$balance", charges] }, // Deduct balance correctly
            transactions: {
              $concatArrays: [
                "$transactions",
                [
                  {
                    channelOrderId: currentOrder.orderId,
                    category: "debit",
                    amount: charges,
                    balanceAfterTransaction: {
                      $subtract: ["$balance", charges],
                    }, // Updated correctly
                    date: new Date()
                      .toISOString()
                      .slice(0, 16)
                      .replace("T", " "),
                    awb_number: trackingId,
                    description: `Freight Charges Applied`,
                  },
                ],
              ],
            },
          },
        },
      ],
      { new: true } // Return updated wallet
    );

    if (!updatedWallet) {
      return { success: false, message: "Wallet update failed" };
    }

    return {
      success: true,
      message: "Shipment created successfully",
      orderId: currentOrder.orderId,
      waybill: trackingId,
      shipmentId: result.shipmentId,
      labelUrl,
    };
  } catch (error) {
    console.error(
      "❌ Error creating Amazon shipment:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

module.exports = { createShipmentAmazon };
