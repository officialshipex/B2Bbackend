const Order = require("../models/newOrder.model");
const Wallet = require("../models/wallet");
const User = require("../models/User.model");
const {
  shipmentTrackingforward,
} = require("../AllCouriers/EcomExpress/Couriers/couriers.controllers");
const {
  trackShipment,
} = require("../AllCouriers/Xpressbees/MainServices/mainServices.controller");
const {
  trackShipmentDelhivery,
} = require("../AllCouriers/Delhivery/Courier/couriers.controller");
const {
  getShipmentTracking,
} = require("../AllCouriers/Amazon/Courier/couriers.controller");
const {
  trackOrderShreeMaruti,
} = require("../AllCouriers/ShreeMaruti/Couriers/couriers.controller");
const {
  trackOrderDTDC,
} = require("../AllCouriers/DTDC/Courier/couriers.controller");
const Bottleneck = require("bottleneck");
const orderSchemaModel = require("../models/orderSchema.model");
const { trackShiprocketCargoOrder } = require("../AllCouriers/ShipRocket/MainServices/mainServices.controller");

const limiter = new Bottleneck({
  minTime: 1000, // 10 requests per second (1000ms delay between each)
  maxConcurrent: 10, // Maximum 10 at the same time
  reservoir: 750, // Max 750 calls per minute
  reservoirRefreshAmount: 750,
  reservoirRefreshInterval: 60 * 1000, // Refresh every 1 minute
});

const trackSingleOrder = async (order) => {
  try {
    // console.log("Tracking order:", order.orderId);
    const { provider, awb_number } = order;
    if (!provider || !awb_number) return;

    const currentWallet = await Wallet.findById(
      (
        await User.findById((await Order.findOne({ awb_number })).userId)
      ).Wallet
    );

    const trackingFunctions = {
      Xpressbees: trackShipment,
      Delhivery: trackShipmentDelhivery,
      ShreeMaruti: trackOrderShreeMaruti,
      DTDC: trackOrderDTDC,
      EcomExpress: shipmentTrackingforward,
      Amazon: getShipmentTracking,
      Shiprocket: trackShiprocketCargoOrder, 
    };

    if (!trackingFunctions[provider]) {
      console.warn(`Unknown provider: ${provider} for Order ID: ${order._id}`);
      return;
    }

    const result = await trackingFunctions[provider](awb_number);
    if (!result || !result.success || !result.data) return;

    const normalizedData = mapTrackingResponse(result.data, provider);
    if (!normalizedData) {
      console.warn(`Failed to map tracking data for AWB: ${awb_number}`);
      return;
    }
    let shouldUpdateWallet = false;
    let balanceTobeAdded = 0;

    if (provider === "EcomExpress") {
      const ecomExpressStatusMapping = {
        "soft data uploaded": "Ready To Ship",
        "pickup assigned": "In-transit",
        "out for pickup": "In-transit",
        "pickup failed": "Ready To Ship",
        "pickup scheduled": "Ready To Ship",
        "field pickup done": "In-transit",
        bagged: "In-transit",
        "bag added to connection": "In-transit",
        "departed from location": "In-transit",
        "redirected to another": "In-transit",
        "bag inscan at location": "In-transit",
        "origin facility inscan": "In-transit",
        "shipment inscan at location": "In-transit",
        "shipment debagged at location": "In-transit",
        "redirected to another delivery center (dc update) ": "In-transit",
        "out for delivery": "Out for Delivery",
        undelivered: "Undelivered",
        "mass update": "Undelivered",
        delivered: "Delivered",
        "arrived at destination": "In-transit",
        "ofd lock": "RTO",
        "rto lock": "RTO",
        returned: "RTO In-transit",
        cancelled: "Cancelled",
        lost: "Cancelled",
        // undelivered: "In-transit",
        "not picked": "Ready To Ship",
      };

      const instruction = normalizedData.Instructions?.toLowerCase();
      order.status = ecomExpressStatusMapping[instruction];

      if (ecomExpressStatusMapping[instruction] === "Out for Delivery") {
        order.ndrStatus = "Out for Delivery";
      }
      console.log("status", normalizedData.Status, normalizedData.Instructions);

      if (order.status === "RTO In-transit" && result.rto_awb) {
        order.awb_number = result.rto_awb;
      } else {
        order.awb_number = result.data.awb_number;
      }
      if (
        normalizedData.Status === "Returned" &&
        normalizedData.Instructions === "Undelivered"
      ) {
        console.log("rto", order.awb_number);
        order.status = "RTO In-transit";
        order.ndrStatus = "RTO In-transit";
      }
      if (
        (order.status === "RTO" || order.status === "RTO In-transit") &&
        (instruction === "bagged" ||
          instruction === "bag added to connection" ||
          instruction === "departed from location" ||
          instruction === "bag inscan at location" ||
          instruction === "shipment debagged at location")
      ) {
        order.status = "RTO In-transit";
        order.ndrStatus = "RTO In-transit";
      }
      if (
        (order.ndrStatus === "Undelivered" ||
          order.ndrStatus === "Out for Delivery") &&
        normalizedData.Instructions === "Delivered"
      ) {
        order.ndrStatus = "Delivered";
      }

      if (
        normalizedData.Instructions === "Undelivered" &&
        order.ndrStatus !== "Action_Requested" &&
        normalizedData.Instructions !== "Out for delivery"
      ) {
        order.status = "Undelivered";
        order.ndrStatus = "Undelivered";
        order.ndrReason = {
          date: normalizedData.StatusDateTime,
          reason: normalizedData.ReasonCode,
        };
        // if (!Array.isArray(order.ndrHistory)) {
        //   order.ndrHistory = [];
        // }
        const lastEntryDate = new Date(
          order.ndrHistory[order.ndrHistory.length - 1]?.date
        ).toDateString();
        const currentStatusDate = new Date(
          normalizedData.StatusDateTime
        ).toDateString();

        if (
          order.ndrHistory.length === 0 ||
          lastEntryDate !== currentStatusDate
        ) {
          const attemptCount = order.ndrHistory?.length || 0;
          if (normalizedData.Instructions === "Undelivered") {
            // console.log("ecom", normalizedData.ReasonCode);

            order.ndrHistory.push({
              date: normalizedData.StatusDateTime,
              action: "Auto Reattempt",
              remark: normalizedData.ReasonCode,
              attempt: attemptCount + 1,
            });
          }
        }
      }

      if (
        (order.status === "RTO" || order.status === "RTO In-transit") &&
        instruction === "delivered"
      ) {
        order.status = "RTO Delivered";
        order.ndrStatus = "RTO Delivered";
      }
    }
    if (provider === "DTDC") {
      const DTDCStatusMapping = {
        "order received": "Ready To Ship",
        "pickup failed": "Ready To Ship",
        "pickup awaited": "Ready To Ship",
        "softdata upload": "Ready To Ship",
        "pickup scheduled": "Ready To Ship",
        "not picked": "Ready To Ship",
        "pickup reassigned": "Ready To Ship",
        "picked up": "In-transit",
        "shipment under investigation": "In-transit",
        booked: "In-transit",
        "in transit": "In-transit",
        "reached at destination": "In-transit",
        "mis route": "In-transit",
        "fdm prepared": "In-transit",
        "wrong pincode": "In-transit",
        "waiting for rto approval from origin": "In-transit",
        "non serviceable location": "In-transit",
        "disturbed/ prohibited area": "In-transit",
        "e-waybill dispute": "In-transit",
        "booking not updated": "In-transit",
        "shipment received after cut-off time at destination": "In-transit",
        "off-loaded by airlines (central team access)": "In-transit",
        "weekly off": "In-transit",
        "stock scan": "In-transit",
        "offload at origin": "In-transit",
        "out for delivery": "Out for Delivery",
        "otp based delivered": "Delivered",
        delivered: "Delivered",
        "not delivered": "Undelivered",
        "set rto initiated": "Undelivered",
        "rto processed & forwarded": "RTO",
        "return as per client instruction.": "RTO",
        "rto booked": "RTO",
        "rto in transit": "RTO In-transit",
        "rto reached at destination": "RTO In-transit",
        "rto fdm prepared": "RTO In-transit",
        "rto not delivered": "RTO In-transit",
        "rto out for delivery": "RTO In-transit",
        "rto mis route": "RTO In-transit",
        "rto delivered": "RTO Delivered",
      };

      const instruction = normalizedData.Instructions?.toLowerCase();
      order.status = DTDCStatusMapping[instruction];

      if (order.status === "RTO") {
        order.ndrStatus = "RTO";
      }
      if (order.status === "RTO In-transit") {
        order.ndrStatus = "RTO In-transit";
      }

      if (DTDCStatusMapping[instruction] === "Out for Delivery") {
        order.ndrStatus = "Out for Delivery";
      }
      if (
        (order.ndrStatus === "Undelivered" ||
          order.ndrStatus === "Out for Delivery") &&
        normalizedData.Instructions === "Delivered"
      ) {
        order.ndrStatus = "Delivered";
      }
      const trackingLength = order.tracking?.length || 0;
      const previousStatus =
        trackingLength >= 2 ? order.tracking[trackingLength - 2]?.status : null;
      if (
        normalizedData.Instructions === "Return as per client instruction." &&
        (trackingLength === 0 ||
          (previousStatus !== "NONDLV" &&
            previousStatus !== "Not Delivered" &&
            previousStatus !== "SETRTO"))
      ) {
        console.log("awb with number", awb_number);
        order.status = "Cancelled";
        order.ndrStatus = "Cancelled";
        balanceTobeAdded =
          order.totalFreightCharges === "N/A"
            ? 0
            : parseInt(order.totalFreightCharges);
        shouldUpdateWallet = true;
      }

      if (normalizedData.Status === "SETRTO") {
        order.reattempt = true;
      } else {
        order.reattempt = false;
      }

      if (
        DTDCStatusMapping[instruction] === "Undelivered" ||
        normalizedData.Instructions === "RTO Not Delivered"
      ) {
        order.status = "Undelivered";
        order.ndrStatus = "Undelivered";
        order.ndrReason = {
          date: normalizedData.StatusDateTime,
          reason: normalizedData.StrRemarks,
        };
        // if (!Array.isArray(order.ndrHistory)) {
        //   order.ndrHistory = [];
        // }
        const lastEntryDate = new Date(
          order.ndrHistory[order.ndrHistory.length - 1]?.date
        ).toDateString();
        const currentStatusDate = new Date(
          normalizedData.StatusDateTime
        ).toDateString();

        if (
          lastEntryDate !== currentStatusDate ||
          order.ndrHistory.length === 0
        ) {
          const attemptCount = order.ndrHistory?.length || 0;
          if (DTDCStatusMapping[instruction] === "Undelivered") {
            // process.exit(1)
            order.ndrHistory.push({
              date: normalizedData.StatusDateTime,
              action: "Auto Reattempt",
              remark: normalizedData.StrRemarks,
              attempt: attemptCount + 1,
            });
            // normalizedData.StrRemarks="";
          }
        }
      }

      if (
        (order.status === "RTO" || order.status === "RTO In-transit") &&
        instruction === "rto delivered"
      ) {
        order.status = "RTO Delivered";
        order.ndrStatus = "RTO Delivered";
      }
      if (
        instruction === "delivered" ||
        instruction === "otp based delivered"
      ) {
        order.status = "Delivered";
        order.ndrStatus = "Delivered";
      }
    }
    if (provider === "Amazon") {
      // console.log("Amazon", normalizedData);
      if (normalizedData.ShipmentType === "FORWARD") {
        if (normalizedData.Instructions === "ReadyForReceive") {
          order.status = "Ready To Ship";
        }
        console.log("Instructions", normalizedData.Instructions);
        if (
          normalizedData.Instructions === "PickupDone" ||
          normalizedData.Instructions === "ArrivedAtCarrierFacility" ||
          normalizedData.Instructions === "Departed"
        ) {
          order.status = "In-transit";
        }
        if (normalizedData.Instructions === "OutForDelivery") {
          order.status = "Out for Delivery";
          order.ndrStatus = "Out for Delivery";
        }
        if (normalizedData.Instructions === "Delivered") {
          order.status = "Delivered";
        }
        if (
          (order.ndrStatus === "Undelivered" ||
            order.ndrStatus === "Out for Delivery") &&
          normalizedData.Instructions === "Delivered"
        ) {
          order.ndrStatus = "Delivered";
        }
        // console.log(
        //   "awb",
        //   order.awb_number,
        //   "time",
        //   normalizedData.StatusDateTime
        // );
        const secondLastTracking =
          Array.isArray(order.tracking) && order.tracking.length >= 2
            ? order.tracking[order.tracking.length - 2]
            : null;
        const wasPreviousDeliveryAttempted =
          secondLastTracking?.Instructions === "DeliveryAttempted";
        if (
          normalizedData.Instructions === "DeliveryAttempted" ||
          wasPreviousDeliveryAttempted
        ) {
          console.log("awb", order.awb_number);
          order.status = "Undelivered";
          order.ndrStatus = "Undelivered";
          order.ndrReason = {
            date: normalizedData.StatusDateTime,
            reason: normalizedData.StrRemarks,
          };
          // if (!Array.isArray(order.ndrHistory)) {
          //   order.ndrHistory = [];
          // }
          const lastEntryDate = new Date(
            order.ndrHistory[order.ndrHistory.length - 1]?.date
          ).toDateString();
          const currentStatusDate = new Date(
            normalizedData.StatusDateTime
          ).toDateString();

          if (
            order.ndrHistory.length === 0 ||
            lastEntryDate !== currentStatusDate
          ) {
            const attemptCount = order.ndrHistory?.length || 0;
            if (
              normalizedData.Instructions === "DeliveryAttempted" ||
              order.tracking[order.tracking.length - 2].Instructions ===
                "DeliveryAttempted"
            ) {
              order.ndrHistory.push({
                date: normalizedData.StatusDateTime,
                action: "Auto Reattempt",
                remark: normalizedData.StrRemarks,
                attempt: attemptCount + 1,
              });
            }
          }
        }
      } else {
        if (
          normalizedData.Instructions === "ReturnInitiated" &&
          order.status === "Undelivered"
        ) {
          order.status = "RTO";
          order.ndrStatus = "RTO";
        }
        if (
          normalizedData.Instructions === "ArrivedAtCarrierFacility" ||
          normalizedData.Instructions === "Departed" ||
          normalizedData.Instructions ===
            "Package arrived at the carrier facility" ||
          normalizedData.Instructions ===
            "Package has left the carrier facility"
        ) {
          order.status = "RTO In-transit";
          order.ndrStatus = "RTO In-transit";
        }
        if (normalizedData.Instructions === "ReturnInitiated") {
          order.status = "RTO In-transit";
        }
        // if (normalizedData.Instructions === "OutForDelivery") {
        //   order.status = "RTO Out for Delivery";
        // }
        if (normalizedData.Instructions === "Delivered") {
          order.status = "RTO Delivered";
          order.ndrStatus = "RTO Delivered";
        }
      }
    } else {
      const statusMap = {
        "UD:Manifested": { status: "Ready To Ship" },
        "UD:In Transit": { status: "In-transit" },
        "UD:Dispatched": {
          status: "Out for Delivery",
          ndrStatus: "Out for Delivery",
        },
        "RT:In Transit": {
          status: "RTO In-transit",

          ndrStatus: "RTO In-transit",
        },
        "DL:RTO": { status: "RTO Delivered", ndrStatus: "RTO Delivered" },
        "DL:Delivered": { status: "Delivered" },
      };

      const key = `${normalizedData.StatusType}:${normalizedData.Status}`;
      const mapped = statusMap[key];

      if (mapped) {
        order.status = mapped.status;
        if (mapped.ndrStatus) order.ndrStatus = mapped.ndrStatus;
      } else if (
        normalizedData.StatusType === "UD" &&
        normalizedData.Status === "Pending" &&
        normalizedData.StatusCode === "ST-108"
      ) {
        order.status = "RTO";
      }

      if (
        (order.ndrStatus === "Undelivered" ||
          order.ndrStatus === "Out for Delivery") &&
        normalizedData.Status === "Delivered"
      ) {
        order.ndrStatus = "Delivered";
      }

      const eligibleNSLCodes = [
        "EOD-74",
        "EOD-15",
        "EOD-104",
        "EOD-43",
        "EOD-86",
        "EOD-11",
        "EOD-69",
        "EOD-6",
      ];
      // if (!Array.isArray(order.ndrHistory)) {
      //   order.ndrHistory = [];
      // }
      const lastEntryDate = new Date(
        order.ndrHistory[order.ndrHistory.length - 1]?.date
      ).toDateString();
      const currentStatusDate = new Date(
        normalizedData.StatusDateTime
      ).toDateString();

      if (
        order.ndrHistory.length === 0 ||
        lastEntryDate !== currentStatusDate
      ) {
        if (
          normalizedData.StatusCode &&
          eligibleNSLCodes.includes(normalizedData.StatusCode)
        ) {
          order.ndrStatus = "Undelivered";
          order.status = "Undelivered";
          order.ndrReason = {
            date: normalizedData.StatusDateTime,
            reason: normalizedData.Instructions,
          };
        }
        const attemptCount = order.ndrHistory?.length || 0;
        order.ndrHistory.push({
          date: normalizedData.StatusDateTime,
          action: "Auto Reattempt",
          remark: normalizedData.Instructions,
          attempt: attemptCount + 1,
        });
      }
    }

    const lastTrackingEntry = order.tracking[order.tracking.length - 1];

    const isSameCheckpoint =
      lastTrackingEntry &&
      lastTrackingEntry.StatusLocation === normalizedData.StatusLocation &&
      new Date(lastTrackingEntry.StatusDateTime).getTime() ===
        new Date(normalizedData.StatusDateTime).getTime();

    if (isSameCheckpoint) {
      // Just update the last entry if the checkpoint is the same
      lastTrackingEntry.status = normalizedData.Status;
      lastTrackingEntry.Instructions = normalizedData.Instructions;
      await order.save();
    } else if (
      !lastTrackingEntry ||
      lastTrackingEntry?.Instructions !== normalizedData.Instructions
    ) {
      // It's a new checkpoint, so push it
      order.tracking.push({
        status: normalizedData.Status,
        StatusLocation: normalizedData.StatusLocation,
        StatusDateTime: normalizedData.StatusDateTime,
        Instructions: normalizedData.Instructions,
      });
      await order.save();
      console.log("saved");
      if (shouldUpdateWallet && balanceTobeAdded > 0) {
        // Step 0: Check if same awb_number already exists twice
        const awbCount = await Wallet.aggregate([
          { $match: { _id: currentWallet._id } },
          { $unwind: "$transactions" },
          { $match: { "transactions.awb_number": order.awb_number || "" } },
          { $count: "count" },
        ]);

        const existingCount = awbCount[0]?.count || 0;

        if (existingCount >= 2) {
          console.log(
            `Skipping wallet update for AWB: ${order.awb_number}, already logged twice.`
          );
          return; // Exit if already present twice
        }

        // Step 1: Update balance
        await Wallet.updateOne(
          { _id: currentWallet._id },
          { $inc: { balance: balanceTobeAdded } }
        );

        // Step 2: Get updated wallet balance
        const updatedWallet = await Wallet.findById(currentWallet._id);

        // Step 3: Push the transaction with correct balance
        await Wallet.updateOne(
          { _id: currentWallet._id },
          {
            $push: {
              transactions: {
                channelOrderId: order.orderId || null,
                category: "credit",
                amount: balanceTobeAdded,
                balanceAfterTransaction: updatedWallet.balance,
                date: new Date().toISOString().slice(0, 16).replace("T", " "),
                awb_number: order.awb_number || "",
                description: "Freight Charges Received",
              },
            },
          }
        );

        console.log(
          "Wallet updated for AWB:",
          order.awb_number,
          "Amount:",
          balanceTobeAdded
        );
      }
    }
  } catch (error) {
    console.error(
      `Error tracking order ID: ${order._id}, AWB: ${order.awb_number} ${error}`
    );
  }
};

// Main controller
const trackOrders = async () => {
  try {
    const pLimit = await import("p-limit").then((mod) => mod.default);
    const limit = pLimit(10); // Max 10 concurrent executions

    const allOrders = await Order.find({
      status: { $nin: ["new", "Cancelled", "Delivered", "RTO Delivered"] },
    });

    console.log(`📦 Found ${allOrders.length} orders to track`);

    const limitedTrack = limiter.wrap(trackSingleOrder); // apply rate limiter

    const trackingPromises = allOrders.map(
      (order) => limit(() => limitedTrack(order)) // limit concurrency
    );

    await Promise.all(trackingPromises);

    console.log("✅ All tracking updates completed");
  } catch (error) {
    console.error("❌ Error in tracking orders:", error);
  }
};

const startTrackingLoop = async () => {
  try {
    console.log("🕒 Starting Order Tracking");
    await trackOrders();
    console.log("⏳ Waiting for 5 minutes before next tracking cycle...");
    setTimeout(startTrackingLoop, 15 * 60 * 1000); // Wait 5 minutes, then call again
  } catch (error) {
    console.error("❌ Error in tracking loop:", error);
    setTimeout(startTrackingLoop, 15 * 60 * 1000); // Retry after 5 minutes even on error
  }
};

startTrackingLoop();

const mapTrackingResponse = (data, provider) => {
  const providerMappings = {
    EcomExpress: {
      Status: data.rts_system_delivery_status || "N/A",
      StatusLocation: data.current_location_name || "N/A",
      StatusDateTime: data.last_update_datetime || null,
      Instructions: data.tracking_status || null,
      ReasonCode: data.reason_code_description || null,
    },
    DTDC: {
      Status: data.trackDetails?.length
        ? data.trackDetails[data.trackDetails.length - 1].strCode
        : "N/A",
      StrRemarks: data.trackHeader?.strRemarks || "N/A",
      StatusLocation: data.trackDetails?.length
        ? data.trackDetails[data.trackDetails.length - 1].strOrigin
        : "N/A",
      StatusDateTime: data.trackDetails?.length
        ? formatDTDCDateTime(
            data.trackDetails[data.trackDetails.length - 1].strActionDate,
            data.trackDetails[data.trackDetails.length - 1].strActionTime
          )
        : null,
      Instructions: data.trackDetails?.length
        ? data.trackDetails[data.trackDetails.length - 1].strAction
        : "N/A",
    },
    Amazon: {
      Status: data.summary?.status || "N/A",
      StrRemarks:
        data.eventHistory?.length &&
        data.eventHistory[data.eventHistory.length - 1]?.shipmentType ===
          "FORWARD"
          ? data.summary?.trackingDetailCodes?.forward?.[0]
          : data.summary?.trackingDetailCodes?.reverse?.[1],
      StatusLocation: data.eventHistory?.length
        ? data.eventHistory[data.eventHistory.length - 1]?.location?.city
        : "N/A",
      StatusDateTime: data.eventHistory?.length
        ? formatAmazonDate(
            data.eventHistory[data.eventHistory.length - 1]?.eventTime
          )
        : "N/A",
      Instructions: data.eventHistory?.length
        ? data.eventHistory[data.eventHistory.length - 1]?.eventCode
        : "N/A",
      ShipmentType: data.eventHistory?.length
        ? data.eventHistory[data.eventHistory.length - 1]?.shipmentType
        : "N/A",
    },

    Shiprocket: {
      Status: data.current_status || null,
      StatusLocation: data.location || "Unknown",
      StatusDateTime: data.timestamp || null,
      Instructions: data.instructions || null,
    },
    NimbusPost: {
      Status: data.status || null,
      StatusCode: data.status_code || null,
      StatusLocation: data.city || "Unknown",
      StatusDateTime: data.updated_on || null,
      Instructions: data.remarks || null,
    },
    Delhivery: {
      Status: data.Status || "N/A",
      StatusType: data.StatusType || "N/A",
      StatusCode: data.StatusCode || null,
      StatusLocation: data.StatusLocation || "Unknown",
      StatusDateTime: data.StatusDateTime || null,
      Instructions: data.Instructions || null,
    },
    Xpressbees: {
      Status: data.tracking_status || null,
      StatusCode: data.status_code || null,
      StatusLocation: data.location || "Unknown",
      StatusDateTime: data.last_update || null,
      Instructions: data.remarks || null,
    },
    ShreeMaruti: {
      Status: data.status || null,
      StatusCode: data.status_code || null,
      StatusLocation: data.current_location || "Unknown",
      StatusDateTime: data.updated_at || null,
      Instructions: data.message || null,
    },
  };

  return providerMappings[provider] || null;
};

const formatDTDCDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr || dateStr.length !== 8 || timeStr.length !== 4) {
    return null; // Handle invalid inputs
  }

  try {
    // Extract date components
    const day = parseInt(dateStr.slice(0, 2));
    const month = parseInt(dateStr.slice(2, 4)) - 1; // JavaScript months are 0-based
    const year = parseInt(dateStr.slice(4, 8));

    // Extract time components
    const hours = parseInt(timeStr.slice(0, 2));
    const minutes = parseInt(timeStr.slice(2, 4));

    // Construct local (IST) date
    const date = new Date(year, month, day, hours, minutes);

    return date; // This will be in local system time (typically IST on Indian servers)
  } catch (err) {
    console.warn(`Invalid DTDC date/time format: ${dateStr} ${timeStr}`);
    return null;
  }
};

const formatAmazonDate = (isoDateStr) => {
  try {
    const d = new Date(isoDateStr);
    return d.toISOString(); // already UTC, just standardize
  } catch (err) {
    console.warn("Invalid Amazon date:", isoDateStr);
    return null;
  }
};

module.exports = {trackSingleOrder,startTrackingLoop};
