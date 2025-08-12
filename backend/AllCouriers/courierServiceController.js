const CourierService = require('../models/CourierService.Schema')


// Find a courier by ID
const getCourierById = async (req, res) => {
    try {
        const courier = await CourierService.findById(req.params.id);
        if (!courier) {
            return res.status(404).json({ message: "Courier not found" });
        }
        res.status(200).json(courier);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Update a courier by ID
const updateCourierById = async (req, res) => {
    try {
        const updatedCourier = await CourierService.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedCourier) {
            return res.status(404).json({ message: "Courier not found" });
        }

        res.status(200).json(updatedCourier);
    } catch (error) {
        res.status(500).json({ message: "Error updating courier", error });
    }
};

module.exports = { getCourierById, updateCourierById };
