if(process.env.NODE_ENV!="production"){
    require('dotenv').config();
}
const axios = require('axios');
const { getToken } = require('../Authorize/shreeMaruti.controller');
const Courier = require("../../../models/courierSecond");
const Services = require("../../../models/courierServiceSecond.model");
const Order = require("../../../models/orderSchema.model");
const { getUniqueId } = require("../../getUniqueId");
const Wallet = require("../../../models/wallet");


const BASE_URL =process.env?.NODE_ENV!="production"?process.env.SHREEMA_STAGING_URL:process.env.SHREEMA_PRODUCTION_URL;

const createShipmentFunctionShreeMaruti = async (selectedServiceDetails, id, wh, walletId, finalCharges) => {
    const API_URL = `${BASE_URL}/fulfillment/public/seller/order/ecomm/push-order`;

    try {
        const token = await getToken();
        const currentOrder = await Order.findById(id);
        const currentWallet = await Wallet.findById(walletId);

        // Prepare order items
        const order_items = currentOrder.Product_details.map((item) => ({
            name: item.product,
            quantity: parseInt(item.quantity),
            price: item.amount * item.quantity,
            unitPrice: parseInt(item.amount),
            weight: parseInt(currentOrder.shipping_cost.weight / currentOrder.Product_details.length),
        }));

        // Payment and shipment details
        const payment_type = currentOrder.order_type === "Cash on Delivery" ? "COD" : "ONLINE";
        const payment_status = currentOrder.order_type === "Cash on Delivery" ? "PENDING" : "PAID";

        // Construct payload
        const payload = {
            orderId: currentOrder.order_id,
            orderSubtype: "FORWARD",
            currency: "INR",
            amount: currentOrder.sub_total,
            weight: parseInt(currentOrder.shipping_cost.weight),
            lineItems: order_items,
            paymentType: payment_type,
            paymentStatus: payment_status,
            length: parseInt(currentOrder.shipping_cost.dimensions.length),
            height: parseInt(currentOrder.shipping_cost.dimensions.height),
            width: parseInt(currentOrder.shipping_cost.dimensions.width),
            billingAddress: {
                name: `${currentOrder.Biling_details.firstName} ${currentOrder.Biling_details.lastName}`,
                phone: currentOrder.Biling_details.phone.toString(),
                address1: currentOrder.Biling_details.address,
                address2: currentOrder.Biling_details.address2,
                city: currentOrder.Biling_details.city,
                state: currentOrder.Biling_details.state,
                country: "India",
                zip: `${currentOrder.Biling_details.pinCode}`,
            },
            shippingAddress: {
                name: `${currentOrder.shipping_details.firstName} ${currentOrder.shipping_details.lastName}`,
                phone: currentOrder.shipping_details.phone.toString(),
                address1: currentOrder.shipping_details.address,
                address2: currentOrder.shipping_details.address2,
                city: currentOrder.shipping_details.city,
                state: currentOrder.shipping_details.state,
                country: "India",
                zip: `${currentOrder.shipping_details.pinCode}`,
            },
            pickupAddress: {
                name: wh.contactName,
                phone: wh.contactNo.toString(),
                address1: wh.addressLine1,
                address2: wh.addressLine2,
                city: wh.city,
                state: wh.state,
                country: "India",
                zip: wh.pinCode,
            },
            returnAddress: {
                name: wh.contactName,
                phone: wh.contactNo.toString(),
                address1: wh.addressLine1,
                address2: wh.addressLine2,
                city: wh.city,
                state: wh.state,
                country: "India",
                zip: wh.pinCode,
            },
        };

        // API request
        const response = await axios.post(API_URL, payload, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        // Handle response
        if (response.data.status === 200) {
            const result = response.data.data;
            currentOrder.status = "Booked";
            currentOrder.cancelledAtStage = null;
            currentOrder.awb_number = result.awb_number;
            currentOrder.shipment_id = `${result.shipperOrderId}`;
            currentOrder.service_details = selectedServiceDetails._id;
            currentOrder.freightCharges = finalCharges === "N/A" ? 0 : parseInt(finalCharges);
            currentOrder.tracking = [{ stage: "Order Booked" }];
            await currentOrder.save();

            const balanceToBeDeducted = finalCharges === "N/A" ? 0 : parseInt(finalCharges);
            const currentBalance = currentWallet.balance - balanceToBeDeducted;

            await currentWallet.updateOne({
                $inc: { balance: -balanceToBeDeducted },
                $push: {
                    transactions: {
                        txnType: "Shipping",
                        action: "debit",
                        amount: balanceToBeDeducted,
                        balanceAfterTransaction: currentBalance,
                        awb_number: `${result.awb_number}`,
                    },
                },
            });

            return { status: 201, message: "Shipment Created Successfully" };
        } else {
            return { status: 400, error: 'Error creating shipment', details: response.data };
        }
    } catch (error) {
        console.log(error);
        console.error('Error in creating shipment:', error.message);
        return { status: 400, error: 'Error creating shipment', details: response.data };
    }
};


module.exports = { createShipmentFunctionShreeMaruti };