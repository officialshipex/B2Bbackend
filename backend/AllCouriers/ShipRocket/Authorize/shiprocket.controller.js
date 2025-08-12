if(process.env.NODE_ENV!="production"){
  require('dotenv').config();
  }
const axios = require("axios");
const AllCourier = require('../../../models/AllCourierSchema');



const refreshShiprocketCargoToken = async () => {
  try {
  
    const refreshToken= process.env.SHIPROCKET_REFRESH_TOKEN

    if (!refreshToken) {
      return res.status(400).json({ error: "Missing refreshToken " });
    }

    const response = await axios.post(
      "https://api-cargo.shiprocket.in/api/token/refresh/",
      {
        refresh: refreshToken,
      },
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(response.data.access);
    return response.data.access;
  } catch (error) {
    console.error("Refresh token error:", error.response?.data || error.message);
    
  }
};
// refreshShiprocketCargoToken()


const getShiprocketAuthentiation = async (req, res) => {
  const SHIPROCKET_USERNAME = process.env.SHIPROCKET_USERNAME;
  const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;
  
  const { username, password } = req.body.credentials; // Destructure credentials
  const { courierName, courierProvider, CODDays, status } = req.body; // Destructure courier data
  // console.log(PASSWORD);

  // Validate if the provided credentials match the expected ones
  if (
    SHIPROCKET_USERNAME !== username ||
    SHIPROCKET_PASSWORD !== password
    
  ) {
    return res
      .status(401)
      .json({ message: "Unauthorized access. Invalid credentials." });
  }

  const courierData = {
    courierName,
    courierProvider,
    CODDays,
    status,
  };

  try {
    // Create a new courier entry in the database
    const newCourier = new AllCourier(courierData);
    await newCourier.save();

    return res.status(201).json({
      message: "Courier successfully added.",
      courier: newCourier,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add courier.",
      error: error.message,
    });
  }
};



module.exports = { refreshShiprocketCargoToken, getShiprocketAuthentiation  };
