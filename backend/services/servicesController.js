const CourierSecond=require("../models/courierServiceSecond.model");

const getServices=async(req,res)=>{
 
    const { provider } = req.query;

    if (!provider) {
      return res.status(400).json({ services: [{ services: [{ courierProviderServiceName: 'Select Courier Service' }] }] });
    }
  
    try {
      const couriers = await CourierSecond.find({ provider }).populate('services');
      res.json({ services: couriers });
    } catch (error) {
      console.error('Error fetching courier services:', error);
      res.status(500).json({ error: 'Error fetching courier services' });
    }
}

const getAllServices = async (req, res) => {
  try {
    const result = await CourierSecond.find({});
    
    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No services found",
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching services:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching services",
      error: error.message,
    });
  }
};

module.exports={getAllServices,getServices};