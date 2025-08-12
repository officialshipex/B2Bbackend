const quickOrder = require("../model/quickOrder.model");
const createQuickOrder = async (req,res) => {
    try {
        const quickOrderData = req.body;
        
        const quickOrders = new quickOrder({
          pickupAddress: quickOrderData.pickupAddress,
          buyerDetails: quickOrderData.buyerDetails,
          buyerAddress: quickOrderData.buyerAddress,
          shippingAddress: quickOrderData.shippingAddress || quickOrderData.buyerAddress,  // Default to buyer's address if empty
          productDetails: quickOrderData.productDetails,
          packageDetails: {
            weight: quickOrderData.packageDetails.weight,
            dimensions: quickOrderData.packageDetails.dimensions,
          },
          paymentMethod: quickOrderData.paymentMethod,
        });
        await quickOrders.save();
        return res.status(201).json({ message: "Order saved successfully" ,quickOrders});
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: "Failed to save order" });
    }
}

module.exports = {
    createQuickOrder
}