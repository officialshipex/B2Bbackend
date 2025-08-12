const { calculateRate } = require("../Rate/calculateRateController");

const RateCalculate = async (req, res) => {
    console.log("sdhajdhjsd")
    try {
        const payload = req.body;
      

        // Log the incoming request
        console.log("Received Payload:", payload);

        // Validate required fields
        const { shipmentType, pickUpPincode, deliveryPincode, weight, declaredValue, paymentType, dimensions } = payload;
        if (!shipmentType || !pickUpPincode || !deliveryPincode || !weight || !declaredValue || !paymentType || !dimensions) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Call the rate calculation service (assuming it returns rate data)
        const rateData = await calculateRate(payload);

        // Send success response
        return res.status(200).json({ success: true, message: "Rate calculated successfully", data: rateData });
    } catch (error) {
        console.error("Error in Rate Calculation:", error.message);

        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = {
    RateCalculate,
};
