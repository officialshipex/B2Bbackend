const axios = require("axios");
const Order = require("../../../models/newOrder.model");
const Wallet = require("../../../models/wallet");
const User = require("../../../models/User.model");
const {
  refreshShiprocketCargoToken,
} = require("../Authorize/shiprocket.controller");
const Plan = require("../../../models/Plan.model");

const createShiprocketCargoOrder = async (req, res) => {
  try {
    const { id, provider, finalCharges, courierServiceName } = req.body;

    // Fetch order, user, and wallet
    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const currentUser = await User.findById(currentOrder.userId);
    const currentWallet = await Wallet.findById(currentUser.Wallet);

    // Check wallet balance
    const effectiveBalance =
      currentWallet.balance - (currentWallet.holdAmount || 0);
    if (effectiveBalance < finalCharges) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient Wallet Balance" });
    }

    // Refresh Shiprocket token
    const accessToken = await refreshShiprocketCargoToken();
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: "Failed to refresh Shiprocket token",
      });
    }

    const totalUnits = currentOrder.packageDetails.reduce((sum, product) => {
      return sum + (product.noOfBox || 0);
    }, 0);

    const productQuantity = currentOrder.productDetails.reduce((sum, prod) => {
      return sum + (prod.quantity || 0);
    }, 0);

    console.log("Total units in package details:", totalUnits);
    console.log("Total quantity in productDetails:", productQuantity);

    // Build the order creation payload
    const payload = {
      no_of_packages: currentOrder.productDetails.length,
      approx_weight: currentOrder.applicableWeight.toString(),
      is_insured: false,
      is_to_pay: false,
      to_pay_amount: null,
      source_warehouse_name: "Petals Mart 2",
      source_address_line1: currentOrder.pickupAddress.address,
      source_address_line2: "",
      source_pincode: currentOrder.pickupAddress.pinCode,
      source_city: currentOrder.pickupAddress.city,
      source_state: currentOrder.pickupAddress.state,
      sender_contact_person_name: currentOrder.pickupAddress.contactName,
      sender_contact_person_email:
        currentUser.email || "sender_contact_person_email@gmail.com",
      sender_contact_person_contact_no:
        currentOrder.pickupAddress.phoneNumber || "9999999999",
      destination_warehouse_name: "Kulla District 2",
      destination_address_line1: currentOrder.receiverAddress.address,
      destination_address_line2: "",
      destination_pincode: currentOrder.receiverAddress.pinCode,
      destination_city: currentOrder.receiverAddress.city,
      destination_state: currentOrder.receiverAddress.state,
      recipient_contact_person_name: currentOrder.receiverAddress.contactName,
      recipient_contact_person_email:
        currentOrder.receiverAddress.email ||
        "recipient_contact_person_email@gmail.com",
      recipient_contact_person_contact_no:
        currentOrder.receiverAddress.phoneNumber,
      client_id: process.env.SHIPROCKET_CLIENT_ID,
      packaging_unit_details: currentOrder.packageDetails.map((product) => ({
        units: product.noOfBox,
        weight: product.applicableWeight || 1,
        length: product?.volumetricWeight?.length || 10,
        height: product?.volumetricWeight?.height || 10,
        width: product?.volumetricWeight?.width || 10,
      })),
      recipient_GST: null,
      supporting_docs: [],
      is_cod: currentOrder.paymentDetails.method === "COD",
      cod_amount:
        currentOrder.paymentDetails.method === "COD"
          ? currentOrder.paymentDetails.amount
          : 0,
      mode_name: "surface",
      tenant_id: process.env.SHIPROCKET_CLIENT_ID,
      channel_partner: null,
      po_no: null,
      po_expiry_date: null,
      is_appointment_taken: false,
    };

    // 1. Create the Shiprocket cargo order
    const response = await axios.post(
      `${process.env.SHIPROCKET_CARGO_URL}/api/external/order_creation/`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.success) {
      return res.status(400).json({
        success: false,
        message: "Failed to create cargo order",
        details: response.data,
      });
    }

    // 2. Update order with status, provider, order id etc.
    currentOrder.status = "Ready To Ship";
    currentOrder.provider = provider;
    currentOrder.courierServiceName = courierServiceName;
    currentOrder.shipmentCreatedAt = new Date();
    currentOrder.order_id = response.data.order_id;
    await currentOrder.save();

    // 3. Debit wallet for finalCharges
    await currentWallet.updateOne({
      $inc: { balance: -finalCharges },
      $push: {
        transactions: {
          channelOrderId: currentOrder.orderId,
          category: "debit",
          amount: finalCharges,
          balanceAfterTransaction: currentWallet.balance - finalCharges,
          date: new Date().toISOString().slice(0, 16).replace("T", " "),
          awb_number: response.data.order_id || "",
          description: "Freight Charges Applied (Cargo)",
        },
      },
    });

    // 4. Prepare shipment association payload
    const pickupDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const pad = (n) => n.toString().padStart(2, "0");
    const pickupDateTimeStr =
      `${pickupDate.getFullYear()}-${pad(pickupDate.getMonth() + 1)}-${pad(
        pickupDate.getDate()
      )} ` +
      `${pad(pickupDate.getHours())}:${pad(pickupDate.getMinutes())}:${pad(
        pickupDate.getSeconds()
      )}`;

    const associationPayload = {
      client_id: process.env.SHIPROCKET_CLIENT_ID,
      order_id: response.data.order_id,
      remarks: `Order remark ${currentOrder.orderId}`,
      recipient_GST: null,
      to_pay_amount: "0",
      mode_id: 16, // surface
      delivery_partner_id: 11, // Example delivery partner
      pickup_date_time: pickupDateTimeStr,
      eway_bill_no: currentOrder.ewayBillNo || "",
      invoice_value: currentOrder.paymentDetails.amount,
      invoice_number:
        currentOrder.invoiceNumber || `INV-${currentOrder.orderId}`,
      invoice_date: currentOrder.invoiceDate
        ? new Date(currentOrder.invoiceDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      supporting_docs: currentOrder.supportingDocs || [],
    };

    // 5. Call shipment association API
    const associationRes = await axios.post(
      `${process.env.SHIPROCKET_CARGO_URL}/api/order_shipment_association/`,
      associationPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Shipment association response:", associationRes.data);

    if (!(associationRes.data && associationRes.data.id)) {
      return res.status(500).json({
        success: false,
        message: "Shipment association failed or no shipment ID returned",
      });
    }

    currentOrder.shipment_id = String(associationRes.data.id);
    await currentOrder.save();

    // 6. Immediately respond (no waybill yet)
    res.status(201).json({
      success: true,
      message:
        "Shiprocket Cargo Order Created & Shipment Associated Successfully",
      data: {
        orderId: currentOrder.orderId,
        order_id: response.data.order_id,
        shipment_id: associationRes.data.id,
        provider,
        waybill_no: null, // Not available immediately
      },
    });

    // 7. Schedule fetching shipment details after 30 seconds (non-blocking)
    setTimeout(async () => {
      try {
        // Refresh token - get a new token because accessToken might expire
        const token = await refreshShiprocketCargoToken();
        if (!token) {
          console.error(
            "Failed to refresh Shiprocket token for delayed waybill fetch."
          );
          return;
        }

        const shipmentDetailsResponse = await axios.get(
          `${process.env.SHIPROCKET_CARGO_URL}/api/external/get_shipment/${associationRes.data.id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(
          "Shipment details response after 30s:",
          shipmentDetailsResponse.data
        );
        if (
          shipmentDetailsResponse.data &&
          shipmentDetailsResponse.data.waybill_no
        ) {
          const waybill = shipmentDetailsResponse.data.waybill_no;
          const childWaybill = shipmentDetailsResponse.data.child_waybill_nos;
          const partner = shipmentDetailsResponse.data.delivery_partner || {};
          const labelUrl =
            shipmentDetailsResponse.data.label_url ||
            shipmentDetailsResponse.data.labelUrl ||
            "";

          // Update the order with waybill_no, child_awb_numbers, delivery partner, label url
          const orderToUpdate = await Order.findById(id);
          if (orderToUpdate) {
            orderToUpdate.awb_number = waybill;
            orderToUpdate.child_awb_numbers = childWaybill || [];
            orderToUpdate.deliveryPartner = {
              name: partner.name || "",
              commonName: partner.common_name || "",
              logo: partner.logo || "",
            };
            orderToUpdate.labelUrl = labelUrl;

            await orderToUpdate.save();
            console.log(
              `Waybill_no updated for order ${orderToUpdate.orderId}: ${waybill}`
            );
          }
        } else {
          console.log(
            `Waybill_no not yet available for shipment_id ${associationRes.data.id} after 30s.`
          );
        }
      } catch (err) {
        console.error(
          "Error fetching/updating waybill_no after 30s:",
          err.message
        );
      }
    }, 30000); // 30 seconds delay
  } catch (error) {
    console.error(
      "Error in createShiprocketCargoOrder:",
      error?.response?.data || error.message
    );
    return res.status(500).json({
      success: false,
      message:
        error?.response?.data?.non_field_errors ||
        "Failed to create Shiprocket Cargo order",
      error: error?.response?.data?.non_field_errors || error.message,
    });
  }
};

const calculateShiprocketCargoCharges = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 2. Find user from Order's MongoDB _id reference and get numeric userId
    let planMarkupPercent = 0;
    let userPlan = null;

    if (order.user) {
      const userDoc = await User.findById(order.user); // order.user should be ObjectId
      if (userDoc) {
        // Find plan by numeric userId from user document
        userPlan = await Plan.findOne({ userId: userDoc.userId });

        const planPercentageMap = {
          "Bronze - 45%": 45,
          "Silver - 35%": 35,
          "Gold - 25%": 25,
          "Platinum - 15%": 15,
        };

        if (userPlan) {
          planMarkupPercent = planPercentageMap[userPlan.planName] || 0;
        }
      }
    }

    // 3. Refresh Shiprocket Token
    const accessToken = await refreshShiprocketCargoToken();
    if (!accessToken) {
      return res
        .status(500)
        .json({ message: "Failed to refresh access token" });
    }

    // 4. Prepare payload
    const firstPackage =
      order.packageDetails && order.packageDetails.length > 0
        ? order.packageDetails[0]
        : null;

    const dimensions = firstPackage?.volumetricWeight || {};
    const product = order.productDetails[0]; // assuming single product

    const payload = {
      from_pincode: order.pickupAddress.pinCode,
      from_city: order.pickupAddress.city,
      from_state: order.pickupAddress.state,
      to_pincode: order.receiverAddress.pinCode,
      to_city: order.receiverAddress.city,
      to_state: order.receiverAddress.state,
      quantity: product.quantity,
      invoice_value: order.paymentDetails.amount,
      calculator_page: "true",
      packaging_unit_details: [
        {
          units: product.noOfBox || 1,
          length: dimensions.length || 10,
          height: dimensions.height || 10,
          width: dimensions.width || 10,
          weight: order.applicableWeight || 1,
          unit: "cm",
        },
      ],
    };

    // 5. Call Shiprocket Cargo API
    const response = await axios.post(
      "https://api-cargo.shiprocket.in/api/shipment/charges/",
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Shiprocket Cargo Charges:", response.data);

    // 6. Fields that should get markup
    const fieldsToMarkup = [
      "rate",
      "freight",
      "handling_charges",
      "oda",
      "fsc",
      "awb_charges",
      "rov",
      "cod_charges",
      "fm_charges",
    ];

    // 7. Function to apply markup exactly like in calculateShiprocketCharges
    const applyPlanMarkup = (service, planMarkupPercent) => {
      if (!service || !service.working) return;

      const w = service.working;

      // Apply markup to allowed fields
      fieldsToMarkup.forEach((field) => {
        if (typeof w[field] === "number" && w[field] > 0) {
          const markupAmount = planMarkupPercent
            ? (w[field] * planMarkupPercent) / 100
            : 0;
          w[field] = parseFloat((w[field] + markupAmount).toFixed(2));
        }
      });

      // total = sum of allowed fields only
      const newTotal = fieldsToMarkup.reduce((sum, field) => {
        if (typeof w[field] === "number") sum += w[field];
        return sum;
      }, 0);

      w.total = parseFloat(newTotal.toFixed(2));

      // grand_total = total + gst
      const gst = typeof w.gst === "number" ? w.gst : 0;
      w.grand_total = parseFloat((newTotal + gst).toFixed(2));
    };

    // 8. Apply markup to both surface and air if available
    applyPlanMarkup(
      response.data["Smart Cargo Advantage-surface"],
      planMarkupPercent
    );
    applyPlanMarkup(
      response.data["Smart Cargo Advantage-air"],
      planMarkupPercent
    );

    // 9. Prepare updated rates array
    const updatedRates = [];
    if (response.data["Smart Cargo Advantage-surface"]) {
      updatedRates.push({
        provider: "Shiprocket",
        courierServiceName:
          response.data["Smart Cargo Advantage-surface"].common_name ||
          "Smart Cargo Advantage-surface",
        courierType: "surface",
        courier:
          response.data["Smart Cargo Advantage-surface"].delivery_partner ||
          "Smart Cargo",
        rate:
          response.data["Smart Cargo Advantage-surface"].working.grand_total ||
          0,
        details: response.data["Smart Cargo Advantage-surface"],
      });
    }
    if (response.data["Smart Cargo Advantage-air"]) {
      updatedRates.push({
        provider: "Shiprocket",
        courierServiceName:
          response.data["Smart Cargo Advantage-air"].common_name ||
          "Smart Cargo Advantage-air",
        courierType: "air",
        courier:
          response.data["Smart Cargo Advantage-air"].delivery_partner ||
          "Smart Cargo",
        rate:
          response.data["Smart Cargo Advantage-air"].working.grand_total || 0,
        details: response.data["Smart Cargo Advantage-air"],
      });
    }
    console.log("Updated Rates:", updatedRates);
    // 10. Send unified response
    res.status(200).json({
      message: `Charges fetched successfully (${planMarkupPercent}% plan markup applied)`,
      plan: userPlan || null,
      data: response.data,
      order,
      updatedRates,
    });
  } catch (error) {
    console.error(
      "Error fetching Shiprocket Cargo charges:",
      error?.response?.data || error.message
    );
    res.status(400).json({
      message: "Failed to fetch charges",
      error: error?.response?.data || error.message,
    });
  }
};

const calculateShiprocketCharges = async (req, res) => {
  try {
    // Refresh Shiprocket access token
    const accessToken = await refreshShiprocketCargoToken();

    if (!accessToken) {
      return res
        .status(500)
        .json({ message: "Failed to refresh Shiprocket access token." });
    }

    // Extract request data
    const {
      pickUpPincode,
      deliveryPincode,
      noOfBox,
      weightPerBox,
      length,
      width: breadth,
      height,
      quantity,
      declaredValue,
      from_city,
      from_state,
      to_city,
      to_state,
    } = req.body;

    // Basic validation
    if (
      !pickUpPincode ||
      !deliveryPincode ||
      !noOfBox ||
      !weightPerBox ||
      !length ||
      !breadth ||
      !height ||
      !from_city ||
      !from_state ||
      !to_city ||
      !to_state
    ) {
      return res.status(400).json({ message: "Required fields missing." });
    }

    // Initialize markup percent and plan doc
    let planMarkupPercent = 0;
    let planDoc = null;

    // Fetch user doc by ObjectId from req.user._id
    if (req.user?._id) {
      const userDoc = await User.findById(req.user._id);

      if (userDoc) {
        // Find plan by numeric userId from user document
        planDoc = await Plan.findOne({ userId: userDoc.userId });

        const planPercentageMap = {
          "Bronze - 45%": 45,
          "Silver - 35%": 35,
          "Gold - 25%": 25,
          "Platinum - 15%": 15,
        };

        if (planDoc) {
          planMarkupPercent = planPercentageMap[planDoc.planName] || 0;
        }
      }
    }

    // Map payload to Shiprocket API format
    const payload = {
      from_pincode: pickUpPincode,
      from_city,
      from_state,
      to_pincode: deliveryPincode,
      to_city,
      to_state,
      quantity: quantity || noOfBox || 1,
      invoice_value: declaredValue || 0,
      calculator_page: "true",
      packaging_unit_details: [
        {
          units: noOfBox,
          length: Number(length),
          width: Number(breadth),
          height: Number(height),
          weight: Number(weightPerBox),
          unit: "cm",
        },
      ],
    };

    // Make API call to Shiprocket for charges
    const response = await axios.post(
      "https://api-cargo.shiprocket.in/api/shipment/charges/",
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Shiprocket Charges Response:", response.data);

    // Fields on which to apply plan markup
    const fieldsToMarkup = [
      "rate",
      "freight",
      "handling_charges",
      "oda",
      "fsc",
      "awb_charges",
      "rov",
      "cod_charges",
      "fm_charges",
    ];

    const applyPlanMarkup = (service, planMarkupPercent) => {
      if (!service || !service.working) return;

      const w = service.working;

      // 1️⃣ Apply markup to allowed fields
      fieldsToMarkup.forEach((field) => {
        if (typeof w[field] === "number" && w[field] > 0) {
          const markupAmount = planMarkupPercent
            ? w[field] * (planMarkupPercent / 100)
            : 0;
          w[field] = parseFloat((w[field] + markupAmount).toFixed(2));
        }
      });

      // 2️⃣ total = sum of allowed fields only
      const newTotal = fieldsToMarkup.reduce((sum, field) => {
        if (typeof w[field] === "number") sum += w[field];
        return sum;
      }, 0);

      w.total = parseFloat(newTotal.toFixed(2));

      // 3️⃣ grand_total = total + gst
      const gst = typeof w.gst === "number" ? w.gst : 0;
      w.grand_total = parseFloat((newTotal + gst).toFixed(2));
    };

    // Apply markup on relevant services if present
    applyPlanMarkup(
      response.data["Smart Cargo Advantage-surface"],
      planMarkupPercent
    );
    applyPlanMarkup(
      response.data["Smart Cargo Advantage-air"],
      planMarkupPercent
    );

    // Build updated rates array to send frontend
    const updatedRates = [];
    if (response.data["Smart Cargo Advantage-surface"]) {
      updatedRates.push({
        provider: "Shiprocket",
        courierServiceName:
          response.data["Smart Cargo Advantage-surface"].common_name ||
          "Smart Cargo Advantage-surface",
        courier:
          response.data["Smart Cargo Advantage-surface"].delivery_partner ||
          "Smart Cargo",
        mode: "surface",
        rate:
          response.data["Smart Cargo Advantage-surface"].working.grand_total ||
          0,
        details: response.data["Smart Cargo Advantage-surface"],
      });
    }

    if (response.data["Smart Cargo Advantage-air"]) {
      updatedRates.push({
        provider: "Shiprocket",
        courierServiceName:
          response.data["Smart Cargo Advantage-air"].common_name ||
          "Smart Cargo Advantage-air",
        courier:
          response.data["Smart Cargo Advantage-air"].delivery_partner ||
          "Smart Cargo",
        mode: "air",
        rate:
          response.data["Smart Cargo Advantage-air"].working.grand_total || 0,
        details: response.data["Smart Cargo Advantage-air"],
      });
    }

    console.log("Updated Rates:", updatedRates);

    // Send response with applied markup and updated totals
    return res.status(200).json({
      message: `Charges fetched successfully (${planMarkupPercent}% plan markup applied)`,
      plan: planDoc || null,
      data: response.data,
      updatedRates,
    });
  } catch (error) {
    console.error(
      "Error in calculateShiprocketCharges:",
      error.response?.data || error.message
    );
    return res.status(500).json({
      message: "Failed to calculate Shiprocket charges.",
      error: error.response?.data || error.message,
    });
  }
};

const getShiprocketCargoOrderDetails = async (req, res) => {
  try {
    const { shipment_id } = req.params;
    const accessToken = await refreshShiprocketCargoToken();
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: "Failed to refresh Shiprocket token",
      });
    }

    const response = await axios.get(
      `https://api-cargo.shiprocket.in/api/external/get_shipment/${shipment_id}/`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Shiprocket get_shipment response:", response.data);

    return res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.log(
      "Error in getShiprocketCargoOrderDetails:",
      error?.response?.data || error.message
    );
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Shiprocket shipment details",
      error: error?.response?.data || error.message,
    });
  }
};

const getShiprocketCargoTracking = async (req, res) => {
  try {
    const { waybill_no } = req.params;

    if (!waybill_no) {
      return res.status(400).json({ error: "Waybill number is required." });
    }

    const accessToken = await refreshShiprocketCargoToken();

    const response = await axios.get(
      `https://api-cargo.shiprocket.in/api/shipment/track/${waybill_no}/`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Shiprocket tracking response:", response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error(
      "Error tracking Shiprocket cargo:",
      error?.response?.data || error.message
    );
    res.status(500).json({
      error:
        error?.response?.data?.message ||
        "Failed to track shipment from Shiprocket Cargo.",
    });
  }
};

const cancelShiprocketOrder = async (req, res) => {
  try {
    const { _id, userId } = req.body;

    const accessToken = await refreshShiprocketCargoToken();

    if (!_id || !userId) {
      return res
        .status(400)
        .json({ error: "Order _id and userId are required" });
    }

    // 1️⃣ Find the user
    const user = await User.findOne({ _id: userId }).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    console.log("Found user:", user);
    // 2️⃣ Find the order
    const order = await Order.findById(_id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    console.log("Found order:", order);
    if (!order.orderId) {
      return res
        .status(400)
        .json({ error: "This order does not have a valid Shiprocket orderId" });
    }

    // 3️⃣ Call Shiprocket Cancel API
    const cancelPayload = {
      ids: [order.orderId], // Shiprocket expects array of integers
    };

    const cancelResponse = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/cancel",
      cancelPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // 4️⃣ If Shiprocket cancellation failed
    if (!cancelResponse.data || cancelResponse.data.status !== 200) {
      return res.status(400).json({
        error: "Failed to cancel shipment with Shiprocket",
        details: cancelResponse.data || {},
      });
    }

    // 5️⃣ Update order & wallet if cancellation successful
    order.status = "Cancelled";
    order.tracking.push({
      title: "Cancelled",
      descriptions: `Order cancelled by user via Shiprocket API`,
    });
    await order.save();

    // Refund wallet
    const wallet = await Wallet.findById(user.Wallet);
    const balanceToAdd =
      order.totalFreightCharges === "N/A"
        ? 0
        : parseInt(order.totalFreightCharges);

    await wallet.updateOne({
      $inc: { balance: balanceToAdd },
      $push: {
        transactions: {
          channelOrderId: order.orderId || null,
          category: "credit",
          amount: balanceToAdd,
          balanceAfterTransaction: wallet.balance + balanceToAdd,
          date: new Date().toISOString().slice(0, 16).replace("T", " "),
          awb_number: order.awb_number || "",
          description: `Freight Charges Received`,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully with Shiprocket",
    });
  } catch (error) {
    console.error(
      "Error cancelling Shiprocket order:",
      error?.response?.data || error
    );
    res.status(500).json({
      error:
        error?.response?.data?.message ||
        "Something went wrong while cancelling Shiprocket order",
    });
  }
};

module.exports = {
  createShiprocketCargoOrder,
  calculateShiprocketCargoCharges,
  calculateShiprocketCharges,
  getShiprocketCargoOrderDetails,
  getShiprocketCargoTracking,
  cancelShiprocketOrder,
};
