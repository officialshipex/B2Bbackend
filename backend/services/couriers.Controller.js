const Couriers = require("../models/courierSecond");

const getCouriers = async (req, res) => {
  try {
    const allCouriers = await Couriers.find({}).populate('services');
    res.status(200).json(allCouriers);
  } catch (error) {
    console.error("Error fetching couriers:", error);
    res.status(500).json({ message: "Failed to fetch couriers", error });
  }
};

module.exports = { getCouriers };
