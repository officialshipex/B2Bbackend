const axios = require("axios");
const DELHIVERY_API_URL = process.env.DELHIVERY_URL;
const DEL_API_TOKEN = process.env.DEL_API_TOKEN;
const Order = require("../models/newOrder.model");
const moment = require("moment");
const FormData = require("form-data");
const {
  getAmazonAccessToken,
} = require("../AllCouriers/Amazon/Authorize/saveCourierController");
const {
  getDTDCAuthToken,
} = require("../AllCouriers/DTDC/Authorize/saveCourierContoller");

const ordersDatabase = [
  {
    orderId: 1,
    platform: "shiprocket",
    details: "Order details for Shiprocket",
  },
  { orderId: 2, platform: "nimbust", details: "Order details for Nimbust" },
];

const getOrderDetails = (orderId) => {
  return ordersDatabase.find((order) => order.orderId === orderId);
};

// Function to call Shiprocket NDR API
const callShiprocketNdrApi = async (orderDetails) => {
  try {
    const response = await axios.post(
      "https://api.shiprocket.in/v1/external/ndr",
      orderDetails
    );
    return response.data;
  } catch (error) {
    throw new Error("Error calling Shiprocket NDR API");
  }
};

// Function to call Nimbust NDR API
const callNimbustNdrApi = async (orderDetails) => {
  try {
    const response = await axios.post(
      "https://api.nimbust.com/v1/ndr",
      orderDetails
    );
    return response.data;
  } catch (error) {
    throw new Error("Error calling Nimbust NDR API");
  }
};

//Function to call Ecom Express NDR API
const callEcomExpressNdrApi = async (
  awb_number,
  action,
  comments,
  scheduled_delivery_date,
  scheduled_delivery_slot,
  mobile,
  consignee_address
) => {
  try {
    let instructionValue = "";

    if (action === "RE-ATTEMPT") {
      instructionValue = "RAD";
    } else if (action === "RTO") {
      instructionValue = "RTO";
    } else {
      return {
        success: false,
        error: "Invalid action. Only 'RE-ATTEMPT' or 'RTO' are supported",
      };
    }

    const shipment = {
      awb: awb_number,
      instruction: instructionValue,
      comments,
    };
    const order = await Order.findOne({ awb_number });
    if (action === "RE-ATTEMPT") {
      if (!scheduled_delivery_date || !scheduled_delivery_slot) {
        return {
          success: false,
          error:
            "For 'RE-ATTEMPT', 'scheduled_delivery_date' and 'scheduled_delivery_slot' are required",
        };
      }

      shipment.scheduled_delivery_date = scheduled_delivery_date;
      shipment.scheduled_delivery_slot = scheduled_delivery_slot;
      console.log("consignement address", consignee_address);

      // Fallback to order.receiverAddress if not provided in the API call
      const isEmptyAddress =
        !consignee_address ||
        !consignee_address.CA1?.trim() ||
        !consignee_address.CA2?.trim() ||
        !consignee_address.CA4?.trim();
      // !consignee_address.pincode?.trim();

      if (isEmptyAddress) {
        const r = order.receiverAddress;
        consignee_address = {
          CA1: r.address || "",
          CA2: `${r.city || ""}, ${r.state || ""}`,
          CA3: "", // optional, fill if needed
          CA4: r.contactName || "",
          // pincode: r.pinCode || "",
        };
      }
      console.log(consignee_address);
      const { CA1, CA2, CA3, CA4 } = consignee_address;
      if (!CA1 || !CA2 || !CA4) {
        return {
          success: false,
          error:
            "Incomplete consignee_address. Fields CA1, CA2, CA4, and pincode are required",
        };
      }

      shipment.consignee_address = consignee_address;

      // Fallback to order.receiverAddress.phoneNumber if mobile not given
      if (!mobile) {
        mobile = order.receiverAddress?.phoneNumber;
      }

      if (!mobile) {
        return {
          success: false,
          error: "Mobile number is required but not found in request or order",
        };
      }

      shipment.mobile = mobile;
    } else if (action === "RTO") {
      // RTO needs no extra data, just log that it's being returned
      // No changes to the shipment object needed
    } else {
      return {
        success: false,
        error: "Invalid action. Only 'RE-ATTEMPT' or 'RTO' are supported",
      };
    }

    const form = new FormData();
    form.append("username", process.env.ECOMEXPRESS_GMAIL);
    form.append("password", process.env.ECOMEXPRESS_PASS);
    form.append("json_input", JSON.stringify([shipment]));

    console.log("ECOMEXPRESS_GMAIL", process.env.ECOMEXPRESS_GMAIL);
    console.log("ECOMEXPRESS_PASS", process.env.ECOMEXPRESS_PASS);
    console.log("json_input", JSON.stringify([shipment]));

    const response = await axios.post(
      "https://api.ecomexpress.in/apiv2/ndr_resolutions/",
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
      }
    );

    console.log("resoso", response.data);

    if (response.data[0].status) {
      if (!Array.isArray(order.ndrHistory)) {
        order.ndrHistory = [];
      }
      const attemptCount = order.ndrHistory?.length || 0;

      // Step 7: Save history entry
      const ndrHistoryEntry = {
        date: new Date(),
        action,
        remark: comments,
        // Fallback to existing remark if tracking is empty
        attempt: attemptCount + 1,
      };

      order.ndrStatus = "Action_Requested";
      order.ndrHistory.push(ndrHistoryEntry);
      await order.save();
    }

    return {
      success: true,
      error: "NDR submitted successfully",
      data: response.data,
    };
  } catch (error) {
    console.error("Ecom Express API Error:", error.response.data);
    return {
      success: false,
      error: "Failed to submit NDR",
      details: error.response?.data || error.message,
    };
  }
};

const submitNdrToAmazon = async (
  awb_number,
  action,
  comments,
  scheduled_delivery_date
) => {
  const accessToken = await getAmazonAccessToken();
  try {
    // Map to Amazon's expected format
    let ndrAction;
    if (action === "RE-ATTEMPT") {
      ndrAction = "REATTEMPT";
    } else if (action === "RTO") {
      ndrAction = "RTO";
    } else if (action === "RESCHEDULE") {
      ndrAction = "RESCHEDULE";
    } else {
      return {
        success: false,
        error: "Invalid action. Allowed values: RE-ATTEMPT, RTO, RESCHEDULE",
      };
    }

    const url =
      "https://sellingpartnerapi-eu.amazon.com/shipping/v2/ndrFeedback";

    const headers = {
      "Content-Type": "application/json",
      "x-amz-access-token": accessToken,
      "x-amzn-shipping-business-id": "AmazonShipping_IN",
    };

    const payload = {
      trackingId: awb_number,
      ndrAction,
    };

    // Attach ndrRequestData conditionally
    if (ndrAction === "RESCHEDULE") {
      if (!scheduled_delivery_date) {
        return {
          success: false,
          error: "scheduled_delivery_date is required for RESCHEDULE",
        };
      }
      payload.ndrRequestData = { rescheduleDate: scheduled_delivery_date };
    } else if (ndrAction === "REATTEMPT") {
      if (!comments) {
        return {
          success: false,
          error: "comments are required for RE-ATTEMPT",
        };
      }
      payload.ndrRequestData = { additionalAddressNotes: comments };
    }

    // Send request
    const response = await axios.post(url, payload, { headers });

    console.log("response", response);
    console.log("Amazon NDR Response:", {
      status: response.status,
      headers: response.headers,
      data: response.data,
    });

    // Check response and update order
    if (response.data) {
      const order = await Order.findOne({ awb_number });

      if (!Array.isArray(order.ndrHistory)) {
        order.ndrHistory = [];
      }

      const attemptCount = order.ndrHistory.length;

      const ndrHistoryEntry = {
        date: new Date(),
        action,
        remark: comments,
        attempt: attemptCount + 1,
      };

      order.ndrStatus = "Action_Requested";
      order.ndrHistory.push(ndrHistoryEntry);
      await order.save();
    }

    return {
      success: true,
      message: "NDR submitted successfully",
      data: response.data,
    };
  } catch (error) {
    console.error(
      "Amazon NDR Submission Error:",
      error.response?.data.errors[0].details
    );
    return {
      success: false,
      error: error.response?.data.errors[0].details,
      // details: error.response?.data[0].details || error.message,
    };
  }
};

async function handleDelhiveryNdrAction(awb_number, action) {
  if (!awb_number || !action) {
    return {
      success: false,
      error: "Missing required parameters: waybill or act",
    };
  }

  try {
    const order = await Order.findOne({ awb_number });
    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const attemptCount = order.ndrHistory?.length || 0;

    if (attemptCount < 0 || attemptCount > 2) {
      return {
        success: false,
        error: "Re-attempt allowed only for attempt count 1 or 2.",
      };
    }

    // ✅ If action is RTO, skip API call and handle manually
    if (action.toUpperCase() === "RTO") {
      if (!Array.isArray(order.ndrHistory)) {
        order.ndrHistory = [];
      }

      const ndrHistoryEntry = {
        date: new Date(),
        action,
        remark:
          order.tracking.length > 0
            ? order.tracking[order.tracking.length - 1].Instructions
            : "Manual RTO Requested",
        attempt: attemptCount + 1,
      };

      order.manualRTOStatus = "Action_Requested";
      order.ndrStatus = "Action_Requested";
      order.status = "Undelivered";
      order.ndrHistory.push(ndrHistoryEntry);

      await order.save();

      return {
        success: true,
        manualRTO: true,
        updated_order: order,
      };
    }

    // Step 3: Call Delhivery NDR API (for non-RTO actions only)
    const payload = {
      data: [
        {
          waybill: String(awb_number).trim(),
          act: String(action).trim().toUpperCase(),
        },
      ],
    };

    console.log("payload", payload, DEL_API_TOKEN);
    const response = await axios.post(
      "https://track.delhivery.com/api/p/update",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${DEL_API_TOKEN}`,
        },
      }
    );

    const request_id = response.data?.request_id || null;
    if (!request_id) {
      return { success: false, error: "No request_id returned from API" };
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const ndrStatusResponse = await axios.get(
      `https://track.delhivery.com/api/cmu/get_bulk_upl/${request_id}?verbose=true`,
      {
        headers: { Authorization: `Token ${DEL_API_TOKEN}` },
      }
    );

    if (ndrStatusResponse.data.status === "Failure") {
      return {
        success: false,
        error: ndrStatusResponse.data.failed_wbns[0].message,
      };
    }

    const { status, remark } = ndrStatusResponse.data;

    if (!Array.isArray(order.ndrHistory)) {
      order.ndrHistory = [];
    }

    const ndrHistoryEntry = {
      date: new Date(),
      action,
      remark:
        order.tracking.length > 0
          ? order.tracking[order.tracking.length - 1].Instructions
          : remark,
      attempt: attemptCount + 1,
    };

    order.ndrStatus = "Action_Requested";
    order.status = "Undelivered";
    order.ndrHistory.push(ndrHistoryEntry);
    await order.save();

    return {
      success: true,
      request_id,
      ndr_status: ndrStatusResponse.data,
      updated_order: order,
    };
  } catch (error) {
    console.error("Error:", error.response);
    return {
      success: false,
      error: "Failed to request NDR action",
      details: error.response?.data || error.message,
    };
  }
}

const submitNdrToDtdc = async (
  awb_number,
  customer_code,
  rtoAction,
  remarks
) => {
  const failedOrders = [];

  // Validation
  if (!awb_number || !customer_code || !rtoAction) {
    return {
      status: 400,
      error: "Missing required fields",
      failedOrders: [{ awb_number, error: "Required fields are missing" }],
    };
  }

  const rtoActionValue =
    rtoAction === "RE-ATTEMPT" ? "1" : rtoAction === "RTO" ? "2" : rtoAction;

  if (rtoActionValue === "1" && (!remarks || remarks.trim() === "")) {
    return {
      status: 400,
      error: "Remarks required for Re-attempt",
      failedOrders: [{ awb_number, error: "Remarks required for Re-attempt" }],
    };
  }

  const payload = [
    {
      consgNumber: awb_number,
      custCode: process.env.DTDC_USERNAME,
      rtoAction: rtoActionValue,
      remarks: remarks || "",
    },
  ];

  const url = "http://bodb.dtdc.com/ctbs-sraa-api/sraa/validateAndSave";

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic R0w5NzExOkdMOTcxMUAyMDI1`,
      },
    });

    const result = response.data;
    console.log("DTDC Response:", result);

    const {
      validConsignmentResponse,
      invalidConsignmentResponse,
    } = result?.result || {};

    const {
      successConsignmentList = [],
      failedConsignmentList = [],
      pendingApprovalConsignmentList = [],
    } = validConsignmentResponse || {};

    const notFound =
      invalidConsignmentResponse?.consignmentsNotFoundResponse || [];

    // Handle invalid or not found AWB
    if (notFound.length > 0) {
      failedOrders.push({
        awb_number,
        error: "Invalid consignment: Not found in DTDC records",
        details: notFound,
      });
    }

    // Handle failed consignments
    if (failedConsignmentList.length > 0) {
      failedOrders.push({
        awb_number,
        error: "DTDC marked consignment as failed",
        details: failedConsignmentList,
      });
    }
console.log("successConsignmentList", successConsignmentList);
    // Handle success consignments
    if (successConsignmentList.some(item => item.consgNumber === awb_number)) {
      const orderInDb = await Order.findOne({ awb_number });

      if (!orderInDb) {
        return {
          status: 404,
          error: "Order not found in DB",
          failedOrders,
        };
      }

      if (!Array.isArray(orderInDb.ndrHistory)) {
        orderInDb.ndrHistory = [];
      }

      const latestInstruction =remarks;

      const ndrHistoryEntry = {
        date: new Date(),
        action: rtoActionValue === "1" ? "RE-ATTEMPT" : "RTO",
        remark: latestInstruction,
        attempt: orderInDb.ndrHistory.length + 1,
      };

      orderInDb.ndrStatus = "Action_Requested";
      orderInDb.status = "Undelivered";
      orderInDb.ndrHistory.push(ndrHistoryEntry);
      await orderInDb.save();
      console.log("Order updated:", orderInDb);

      return {
        status: 200,
        success: true,
        message: "DTDC NDR submission successful",
        failedOrders,
        dtdcResponse: result, 
      };
    }

    // Handle pending approval case
    if (pendingApprovalConsignmentList.length > 0) {
      return {
        status: 202,
        success: true,
        message: "NDR submitted and is pending DTDC approval",
        pendingApproval: pendingApprovalConsignmentList,
        failedOrders,
        dtdcResponse: result,
      };
    }

    // If nothing was successful or pending
    return {
      status: 422,
      success: false,
      error: "Consignment validation failed or not processed",
      failedOrders,
      dtdcResponse: result,
    };
  } catch (error) {
    console.error(
      "DTDC Submission Error:",
      error?.response?.data || error.message
    );
    return {
      status: 500,
      success: false,
      error: "Error occurred while submitting NDR to DTDC",
      details: error?.response?.data || error.message,
    };
  }
};


module.exports = {
  getOrderDetails,
  callShiprocketNdrApi,
  callNimbustNdrApi,
  callEcomExpressNdrApi,
  handleDelhiveryNdrAction,
  submitNdrToDtdc,
  submitNdrToAmazon,
};
