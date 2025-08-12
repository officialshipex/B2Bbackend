const Wallet = require("../models/wallet");
const User = require("../models/User.model");

require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");
const FRONTEND_URL = process.env.FRONTEND_URL;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create an order
const createOrder = async (req, res) => {
  try {
    const id = req.user.id;
    const { amount, walletId: walletIdFromBody } = req.body;

    const user = await User.findById(id);

    // Use walletId from body if present, otherwise fallback to user's wallet
    const walletId = walletIdFromBody || user?.Wallet;

    console.log("walet", walletId);

    if (!walletId) {
      return res.status(400).json({
        success: false,
        message: "Wallet ID is required and not found in user profile.",
      });
    }

    console.log("walletId", walletId);

    const options = {
      amount: amount * 100, // in paisa
      currency: "INR",
      receipt: `order_rcptid_${Math.floor(Math.random() * 10000)}`,
      notes: {
        walletId: walletId.toString(), // Razorpay needs string values in notes
      },
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.error("Error in createOrder:", error);
    res.status(500).json({
      success: false,
      message: "Order creation failed",
      error: error.message,
    });
  }
};

const generateUniqueTransactionId = async () => {
  let transactionId, exists;
  do {
    transactionId =
      Date.now().toString().slice(-6) + Math.floor(1000 + Math.random() * 9000);

    // Check if any wallet has at least one walletHistory entry with this transactionId
    exists = await Wallet.exists({
      walletHistory: {
        $elemMatch: {
          "paymentDetails.transactionId": transactionId,
        },
      },
    });
  } while (exists);
  console.log("trans", transactionId);
  return transactionId;
};

// Razorpay webhook handler
const razorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const razorpaySignature = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (razorpaySignature !== expectedSignature) {
    console.log("validation failed");
    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  }

  const event = req.body;
  console.log("event", event);

  try {
    if (
      event.event !== "payment.captured" &&
      event.event !== "payment.failed"
    ) {
      console.log("Unhandled Razorpay webhook event:", event.event);
      return res.status(200).json({ success: true, message: "Event ignored" });
    }

    const payment = event.payload.payment.entity;

    console.log("payment", payment);

    // Fetch full payment details to get the original order notes (like walletId)
    const fullPayment = await razorpay.payments.fetch(payment.id);
    console.log("fullpayment", fullPayment);
    const order = await razorpay.orders.fetch(payment.order_id);
    console.log("order", order);
    const walletId = order.notes?.walletId || fullPayment.notes?.walletId;
    console.log("walletId", walletId);

    if (!walletId) {
      console.log("Missing walletId in payment notes:", fullPayment.notes);
      return res
        .status(400)
        .json({ success: false, message: "Missing walletId" });
    }

    let wallet = await Wallet.findById(walletId);
    if (!wallet) {
      console.log("wallet not found");
      return res
        .status(404)
        .json({ success: false, message: "Wallet not found" });
    }

    // If walletHistory does not exist, initialize it as an empty array
    if (!wallet.walletHistory) {
      wallet.walletHistory = [];
    }

    const alreadyExists = wallet.walletHistory.some(
      (txn) => txn.paymentDetails?.paymentId === payment.id
    );
    if (alreadyExists) {
      return res.status(200).json({
        success: true,
        message:
          event.event === "payment.failed"
            ? "Failed payment already logged"
            : "Payment already processed",
      });
    }

    const rrn = fullPayment.acquirer_data?.rrn;
    if (rrn && typeof rrn === "string" && rrn.trim() !== "") {
      console.log("✅ Using Razorpay RRN as transaction ID:", rrn);
    } else {
      console.log(
        "⚠️ RRN missing or invalid, generating fallback transaction ID"
      );
    }
    const transactionId =
      rrn && rrn.trim() !== "" ? rrn : await generateUniqueTransactionId();

    const amount = payment.amount / 100;

    const paymentDetails = {
      paymentId: payment.id,
      orderId: payment.order_id,
      walletId,
      amount,
      transactionId: transactionId,
    };
    console.log("transaction id");

    if (event.event === "payment.captured") {
      console.log("payment captured");
      wallet.balance += amount;

      wallet.walletHistory.push({
        status: "success",
        paymentDetails: {
          ...paymentDetails,
          signature: payment.signature || "",
        },
      });

      await wallet.save();
      return res.status(200).json({
        success: true,
        message: "Payment captured & wallet updated",
      });
    }

    if (event.event === "payment.failed") {
      console.log("payment failed");
      wallet.walletHistory.push({
        status: "failed",
        paymentDetails: {
          ...paymentDetails,
          description: payment.error_description || "No description provided",
        },
      });

      await wallet.save();
      return res
        .status(200)
        .json({ success: true, message: "Failed payment logged" });
    }

    console.log("Unhandled Razorpay webhook event:", event.event);
    return res
      .status(200)
      .json({ success: true, message: "Unhandled event type" });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// const verifyPayment = async (req, res) => {
//   const {
//     razorpay_order_id,
//     razorpay_payment_id,
//     razorpay_signature,
//     walletId,
//     amount,
//   } = req.body;

//   const generated_signature = crypto
//     .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//     .update(razorpay_order_id + "|" + razorpay_payment_id)
//     .digest("hex");

//   if (generated_signature === razorpay_signature) {
//     console.log("Payment verified successfully");

//     try {
//       const currentWallet = await Wallet.findById(walletId);

//       if (!currentWallet) {
//         return res
//           .status(404)
//           .json({ success: false, message: "Wallet not found" });
//       }

//       // Update balance
//       currentWallet.balance += amount;
//       // Generate unique 10-digit transactionId
//       let transactionId;
//       let exists = true;

//       while (exists) {
//         transactionId =
//           Date.now().toString().slice(-6) +
//           Math.floor(1000 + Math.random() * 9000);
//         exists = await Wallet.exists({
//           "walletHistory.paymentDetails.transactionId": transactionId,
//         });
//       }

//       // Save detailed walletHistory (only payment info)
//       currentWallet.walletHistory.push({
//         status: "success",
//         paymentDetails: {
//           paymentId: razorpay_payment_id,
//           orderId: razorpay_order_id,
//           signature: razorpay_signature,
//           walletId: walletId,
//           amount: amount,
//           transactionId: transactionId,
//         },
//       });

//       await currentWallet.save();

//       console.log("Wallet updated with payment details");

//       res.json({ success: true, message: "Payment successful" });
//     } catch (err) {
//       console.error("Error processing payment:", err);
//       res.status(500).json({
//         success: false,
//         message: "Server error during payment processing",
//       });
//     }
//   } else {
//     res
//       .status(400)
//       .json({ success: false, message: "Payment verification failed" });
//   }
// };

const getWalletHistoryByUserId = async (req, res) => {
  try {
    const {
      id,
      page = 1,
      limit = 10,
      transactionId,
      paymentId,
      status,
      fromDate,
      toDate,
    } = req.query;
    const userId = id || req.user._id;
    console.log("trans", req.query);
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Get user wallet ID
    const user = await User.findById(userId).select("Wallet").lean();
    if (!user?.Wallet) {
      return res.status(404).json({ message: "Wallet not found for user." });
    }

    const wallet = await Wallet.findById(user.Wallet)
      .select("walletHistory")
      .lean();
    if (!wallet) {
      return res.status(404).json({ message: "Wallet data not found." });
    }

    let history = wallet.walletHistory || [];

    // Apply filters
    history = history.filter((item) => {
      const matchTransactionId = transactionId
        ? item.paymentDetails.transactionId?.includes(transactionId)
        : true;
      const matchPaymentId = paymentId
        ? item.paymentDetails.paymentId?.includes(paymentId)
        : true;
      const matchStatus = status ? item.status === status : true;

      const itemDate = new Date(item.date);
      const matchFromDate = fromDate ? itemDate >= new Date(fromDate) : true;
      const matchToDate = toDate ? itemDate <= new Date(toDate) : true;

      return (
        matchTransactionId &&
        matchPaymentId &&
        matchStatus &&
        matchFromDate &&
        matchToDate
      );
    });

    // Sort and paginate
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    const totalCount = history.length;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginated = history.slice(start, end);

    return res.status(200).json({
      success: true,
      data: paginated,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching wallet history:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching wallet history",
    });
  }
};

const getWalletBalanceAndHoldAmount = async (req, res) => {
  try {
    const { id } = req.query;
    let userId;
    if (id) {
      userId = id;
    } else {
      userId = req.user._id;
    }

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Step 1: Get the user's wallet ID
    const user = await User.findById(userId).select("Wallet").lean();
    if (!user?.Wallet) {
      return res.status(404).json({ message: "Wallet not found for user." });
    }

    // Step 2: Fetch balance and holdAmount from wallet
    const wallet = await Wallet.findById(user.Wallet)
      .select("balance holdAmount")
      .lean();

    if (!wallet) {
      return res.status(404).json({ message: "Wallet data not found." });
    }

    // Step 3: Return the data
    return res.status(200).json({
      success: true,
      balance: wallet.balance || 0,
      holdAmount: wallet.holdAmount || 0,
    });
  } catch (error) {
    console.error("Error fetching wallet balance and holdAmount:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching wallet balance and hold amount",
    });
  }
};

module.exports = {
  createOrder,
  razorpayWebhook,
  getWalletHistoryByUserId,
  getWalletBalanceAndHoldAmount,
};
