require('dotenv').config();
const axios = require('axios');
const Courier=require("../../../models/courierSecond");

const getAccessToken = async () => {
    const credentials = {
        username: process.env.SMARTSHIP_USERNAME,
        password: process.env.SMARTSHIP_PASSWORD,
        client_id: process.env.SMARTSHIP_CLIENT_ID,
        client_secret: process.env.SMARTSHIP_CLIENT_SECRET,
        grant_type: "password",
    };

    try {
        const response = await axios.post('https://oauth.smartship.in/loginToken.php', credentials, {
            headers: { 'Content-Type': 'application/json' },
        });
        console.log('Access Token:', response.data.access_token);
        return response.data.access_token   
    } catch (error) {
        console.log('Error fetching access token:', error.response);
        return error.response.data
        }
    }

    const saveSmartShip=async(req,res)=>{
        try {
            const existingCourier = await Courier.findOne({ provider: 'SmartShip' });
        
            if (existingCourier) {
              return res.status(400).json({ message: 'SmartShip service is already added' });
            }
        
            const newCourier = new Courier({
              provider: 'SmartShip'
            });
            await newCourier.save();
            res.status(201).json({ message: 'SmartShip Integrated Successfully' });
          } catch (error) {
            res.status(500).json({ message: 'An error has occurred', error: error.message });
          }
    }

    const isEnabeled = async (req, res) => {
      try {
        const existingCourier = await Courier.findOne({ provider:'SmartShip'});
    
        if (!existingCourier) {
          return res.status(404).json({ isEnabeled: false, message: "Courier not found" });
        }
    
        if (existingCourier.isEnabeled && !existingCourier.toEnabeled) {
          return res.status(201).json({ isEnabeled: true, toEnabeled: false });
      
      } else if (!existingCourier.isEnabeled && existingCourier.toEnabeled) {
          return res.status(201).json({ isEnabeled: false, toEnabeled: true });
      
      } else if (existingCourier.isEnabeled && existingCourier.toEnabeled) {
          return res.status(201).json({ isEnabeled: true, toEnabeled: true });
      
      } else {
          return res.status(201).json({ isEnabeled: false, toEnabeled: false });
      }
      
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
      };


      const enable = async (req, res) => {

        try {
          const existingCourier = await Courier.findOne({ provider:'SmartShip'});
      
          if (!existingCourier) {
            return res.status(404).json({ isEnabeled: false, message: "Courier not found" });
          }
      
          existingCourier.isEnabeled = true;
          existingCourier.toEnabeled = false;
          const result = await existingCourier.save();
          return res.status(201).json({ isEnabeled: true, toEnabeled: false });
        }
        catch (error) {
          onsole.error("Error:", error);
          res.status(500).json({ message: "Internal Server Error" });
        }
      
      }

      const disable = async (req, res) => {

        try {
          const existingCourier = await Courier.findOne({ provider:'SmartShip'});
      
          if (!existingCourier) {
            return res.status(404).json({ isEnabeled: false, message: "Courier not found" });
          }
      
          existingCourier.isEnabeled = true;
          existingCourier.toEnabeled = true;
          const result=await existingCourier.save();
          return res.status(201).json({ isEnabeled: true, toEnabeled:true});
        }
        catch (error) {
          onsole.error("Error:", error);
          res.status(500).json({ message: "Internal Server Error" });
        }
      
      }
    


module.exports = { getAccessToken,saveSmartShip,isEnabeled,disable,enable};