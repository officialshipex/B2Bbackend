const cron = require("node-cron");
const CodPlan = require("./codPan.model");
const codRemittance = require("./codRemittance.model");
const Order = require("../models/newOrder.model");
const adminCodRemittance = require("./adminCodRemittance.model");
const users = require("../models/User.model.js");
const Wallet = require("../models/wallet");
const afterPlan = require("./afterPlan.model");
const fs = require("fs");
const csvParser = require("csv-parser");
const ExcelJS = require("exceljs");
const path = require("path");
const xlsx = require("xlsx");
const File = require("../model/bulkOrderFiles.model.js");
const CourierCodRemittance = require("./CourierCodRemittance.js");
const CodRemittanceOrders = require("./CodRemittanceOrder.model.js");
const SameDateDelivered = require("./samedateDelivery.model.js");
// Core function: process remittances (no req/res here)
const processCourierCodRemittance = async () => {
  // console.log("----------->")
  // Step 1: Get all Delivered COD Orders
  const codDeliveredOrders = await Order.aggregate([
    {
      $match: {
        status: "Delivered",
        "paymentDetails.method": "COD",
      },
    },
  ]);

  // Step 2: Get all remitted orderIDs using aggregation
  const remittedOrders = await CourierCodRemittance.aggregate([
    {
      $project: {
        _id: 0,
        orderID: 1,
      },
    },
  ]);

  // Step 3: Extract orderIDs already remitted
  const remittedOrderIds = remittedOrders.map((entry) => entry.orderID);

  // Step 4: Filter unremitted COD Delivered orders
  const newCodDeliveredOrders = codDeliveredOrders.filter(
    (order) => !remittedOrderIds.includes(order.orderId)
  );

  // Step 5: Decide what orders to process
  const ordersToProcess =
    remittedOrderIds.length === 0 ? codDeliveredOrders : newCodDeliveredOrders;

  // Step 6: Save new remittance records
  for (const order of ordersToProcess) {
    const userData = await users.findOne({ _id: order.userId });
    if (!userData) {
      console.log(`User not found for order ${order.orderId}`);
      continue;
    }

    const lastTrackingUpdate =
      order.tracking?.length > 0
        ? order.tracking[order.tracking.length - 1]?.StatusDateTime
        : null;

    const newRemittance = new CourierCodRemittance({
      userId: order.userId,
      date: lastTrackingUpdate,
      orderID: order.orderId,
      userName: userData.fullname || "",
      PhoneNumber: userData.phoneNumber || "",
      Email: userData.email || "",
      courierServiceName: order.courierServiceName || "",
      AwbNumber: order.awb_number || "",
      CODAmount: order.paymentDetails?.amount || 0,
      status: "Pending",
    });

    await newRemittance.save();
  }

  return {
    success: true,
    message: "Courier COD remittance processed successfully.",
  };
};
processCourierCodRemittance();
cron.schedule(
  "0 0,12 * * *",
  () => {
    console.log("Running scheduled task every 12 hours (IST)");
    processCourierCodRemittance();
  },
  {
    timezone: "Asia/Kolkata",
  }
);

const processCodRemittanceOrder = async () => {
  const codDeliveredOrders = await Order.aggregate([
    {
      $match: {
        status: "Delivered",
        "paymentDetails.method": "COD",
      },
    },
  ]);
  const remittedOrders = await CodRemittanceOrders.aggregate([
    {
      $project: {
        _id: 0,
        orderID: 1,
      },
    },
  ]);
  // Extract orderIDs already remitted
  const remittedOrderIds = remittedOrders.map((entry) => Number(entry.orderID));
  //Filter unremitted COD Delivered orders
  const newCodDeliveredOrders = codDeliveredOrders.filter(
    (order) => !remittedOrderIds.includes(order.orderId)
  );
  const ordersToProcess =
    remittedOrderIds.length === 0 ? codDeliveredOrders : newCodDeliveredOrders;

  for (const order of ordersToProcess) {
    const userData = await users.findOne({ _id: order.userId });
    if (!userData) {
      console.log(`User not found for order ${order.orderId}`);
      continue;
    }

    const lastTrackingUpdate =
      order.tracking?.length > 0
        ? order.tracking[order.tracking.length - 1]?.StatusDateTime
        : null;

    const newRemittanceOrder = new CodRemittanceOrders({
      Date: lastTrackingUpdate,
      orderID: order.orderId,
      userName: userData.fullname,
      PhoneNumber: userData.phoneNumber,
      Email: userData.email,
      courierProvider: order.courierServiceName || "N/A",
      AWB_Number: order.awb_number || "N/A",
      CODAmount: String(order.paymentDetails.amount || "0"),
      status: "Pending",
    });
    await newRemittanceOrder.save();
  }
  return {
    success: true,
    message: "Courier COD remittance processed successfully.",
  };
};

cron.schedule(
  "0 0,12 * * *",
  () => {
    console.log("Running scheduled task every 12 hours (IST)");
    processCodRemittanceOrder();
  },
  {
    timezone: "Asia/Kolkata",
  }
);
