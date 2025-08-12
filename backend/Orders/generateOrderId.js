const Order = require("../models/orderSchema.model");

function generateRandomInteger() {
    let randomNumber = '';
    for (let i = 0; i < 10; i++) {
        const digit = Math.floor(Math.random() * 10);
        randomNumber += digit;
    }
    return randomNumber;
}

async function generateOrderId(req, res) {
    const maxRetries = 100;
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            let id = generateRandomInteger();
            let existingOrder = await Order.findOne({ order_id: id });

            if (!existingOrder) {
                return res.status(201).json({ success: true, order_id: id });
                
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: "Failed to generate order ID", error: error.message });
        }
        attempts++;
    }

    return res.status(500).json({ success: false, message: "Exceeded maximum retries to generate a unique order ID" });
}

module.exports = { generateOrderId };

