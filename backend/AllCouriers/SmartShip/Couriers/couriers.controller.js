const axios = require('axios');
require('dotenv').config();
const { getAccessToken } =require("../Authorize/smartShip.controller");
const Courier=require("../../../models/courierSecond");
const Services=require("../../../models/courierServiceSecond.model");
const{getUniqueId}=require("../../getUniqueId");

const getCouriers = async (req, res) => {
    try {
        const hardCoreServices = [
            { name: "service1" },
            { name: "service2" },
            { name: "service3" }
        ];

        if (hardCoreServices && hardCoreServices.length > 0) {
            const servicesData = hardCoreServices;
            const currCourier = await Courier.findOne({ provider: 'SmartShip' }).populate('services');
            const prevServices = new Set(currCourier.services.map(service => service.courierProviderServiceName));

            const allServices = servicesData.map(element => ({
                service: element.name,
                isAdded: prevServices.has(element.name)
            }));

            return res.status(201).json(allServices);
        }

        res.status(400).json({ message: 'Failed to fetch services' });

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch couriers', details: error.message });
    }
};


const addService = async (req, res) => {
    try {

        const currCourier = await Courier.findOne({ provider: 'SmartShip' });

        const prevServices = new Set();
        const services = await Services.find({ '_id': { $in: currCourier.services } });

        services.forEach(service => {
            prevServices.add(service.courierProviderServiceName);
        });

        const name = req.body.service;

        if (!prevServices.has(name)) {
            const newService = new Services({
                courierProviderServiceId: getUniqueId(),
                courierProviderServiceName: name,
                courierProviderName:'SmartShip'
            });

            const S2 = await Courier.findOne({ provider: 'SmartShip' });
            S2.services.push(newService._id);

            await newService.save();
            await S2.save();

            // console.log(`New service saved: ${name}`);

            return res.status(201).json({ message: `${name} has been successfully added` });
        }

        return res.status(400).json({ message: `${name} already exists` });
    } catch (error) {
        console.error(`Error adding service: ${error.message}`);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

//1.One Stap Order Registration...
const OneStapOrderRegisteration = async(req,res) => {
    try {
        const url = 'https://api.smartship.in/v2/app/Fulfillmentservice/orderRegistrationOneStep';
        const orderData = req.body;  
        const token = await getAccessToken();

        const response = await axios.post(url, orderData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("API response:", response.data);
        return res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error("Error during hub registration:", error);

        return res.status(500).json({
            success: false,
            error: error.message || 'An unknown error occurred'
        });
    }
}

//2. Order Registration .....
const orderRegistration = async(req,res) => {
    try {
        const url = 'https://api.smartship.in/v2/app/Fulfillmentservice/orderRegistration';
        const orderData = req.body;
        const token = await getAccessToken();

        const response = await axios.post(url, orderData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("API response:", response.data);
        return res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error("Error during hub registration:", error);
        return res.status(500).json({
            success: false,
            error: error.message || 'An unknown error occurred'
        });
    }
}

//3.Get Order details...
const getOrderDetails = async(req,res) => {
    try {
        const url = 'https://api.smartship.in/v2/app/Fulfillmentservice/orderDetails';
        const orderData = req.body;
        const token = await getAccessToken();

        const response = await axios.post(url, orderData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("API response:", response.data);
        return res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error("Error during hub registration:", error);
        return res.status(500).json({
            success: false,
            error: error.message || 'An unknown error occurred'
        });
    }
}

//4.create Manifest....
const createManifest = async(req,res) => {
    try {
        const url = 'https://api.smartship.in/v2/app/Fulfillmentservice/createManifest';
        const orderData = req.body;
        const token = await getAccessToken();

        const response = await axios.post(url, orderData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("API response:", response.data);
        return res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error("Error during hub registration:", error);
        return res.status(500).json({
            success: false,
            error: error.message || 'An unknown error occurred'
        });
    }
}

//5.get Shipping label..
const getShippingLabel = async(req,res) => {
    try {
        const url = 'https://api.smartship.in/v2/app/Fulfillmentservice/getShippingLabels';
        const orderData = req.body;
        const token = await getAccessToken();
    
        const response = await axios.post(url, orderData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("API response:", response.data);
        return res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error("Error during hub registration:", error);
        return res.status(500).json({
            success: false,
            error: error.message || 'An unknown error occurred'
        });
    }

}

//6.Cancel Order...
const cancelOrder = async(req,res) => {
    try {
        const url = ':https://api.smartship.in/v2/app/Fulfillmentservice/orderCancellation';
        const orderData = req.body;
        const token = await getAccessToken();
    
        const response = await axios.post(url, orderData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("API response:", response.data);
        return res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error("Error during hub registration:", error);
        return res.status(500).json({
            success: false,
            error: error.message || 'An unknown error occurred'
        });
    }
}

//7.tracking order by Tracking Id...
const  trackOrderByTrackingID = async(req,res) => {
    try {
        const url = `https://api.smartship.in/v1/Trackorder?tracking_numbers=${tracking_number}`;
        const tracking_number = req.body;
        const token = await getAccessToken();
    
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("API response:", response.data);
        return res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error("Error during hub registration:", error);
        return res.status(500).json({
            success: false,
            error: error.message || 'An unknown error occurred'
        });
    }
}

//8.tracking order by Tracking Id...
const  trackOrderByRequestorderId = async(req,res) => {
    try {
        const url = `https://api.smartship.in/v1/Trackorder?request_order_ids=${request_order_ids}`;
        const request_order_ids = req.body;
        const token = await getAccessToken();
    
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("API response:", response.data);
        return res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error("Error during hub registration:", error);
        return res.status(500).json({
            success: false,
            error: error.message || 'An unknown error occurred'
        });
    }
}

//8.tracking order by Tracking Id...
const  trackOrderByOrderReferenceId = async(req,res) => {
    try {
        const url = `https://api.smartship.in/v1/Trackorder?order_reference_ids=${order_reference_ids}`;
        const order_reference_ids = req.body;
    
        const token = await getAccessToken();
    
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("API response:", response.data);
        return res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error("Error during hub registration:", error);
        return res.status(500).json({
            success: false,
            error: error.message || 'An unknown error occurred'
        });
    }
}

//8.Hub registration....
// const hubRegistration = async (req, res) => {
//     try {
//         const url = 'https://api.smartship.in/v2/app/Fulfillmentservice/hubRegistration';
//         const hubData = req.body;

//         const token = await getAccessToken();

//         const response = await axios.post(url, hubData, {
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         console.log("API response:", response.data);e
//         return res.json({
//             success: true,
//             data: response.data
//         });
//     } catch (error) {
//         console.error("Error during hub registration:", error);
//         return res.status(500).json({
//             success: false,
//             error: error.message || 'An unknown error occurred'
//         });
//     }
// };

// // 9.
// const getHubDetails = async(req,res) => {
//     try {
//         const url = 'https://api.smartship.in/v2/app/Fulfillmentservice/getHubDetail';
//         const hubData = req.body;

//         const token = await getAccessToken();

//         const response = await axios.post(url, hubData, {
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         console.log("API response:", response.data);
//         return res.json({
//             success: true,
//             data: response.data
//         });
//     } catch (error) {
//         console.error("Error during hub registration:", error);
//         return res.status(500).json({
//             success: false,
//             error: error.message || 'An unknown error occurred'
//         });
        
//     }
// }

// //10.
// const deleteHub = async(req,res) => {
//     try {
//         const url = 'https://api.smartship.in/v2/app/Fulfillmentservice/deleteHub';
//         const hubData = req.body;

//         const token = await getAccessToken();

//         const response = await axios.post(url, hubData, {
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             }
//         });
        
//         console.log("API response:", response.data);
//         return res.json({
//             success: true,
//             data: response.data
//         });
//     } catch (error) {
//         console.error("Error during hub registration:", error);
//         return res.status(500).json({
//             success: false,
//             error: error.message || 'An unknown error occurred'
//         });
        
//     }
// }

module.exports = {
    OneStapOrderRegisteration,
    orderRegistration,
    getOrderDetails,
    createManifest,
    getShippingLabel,
    cancelOrder,
    trackOrderByTrackingID,
    trackOrderByRequestorderId,
    trackOrderByOrderReferenceId,
    getCouriers,
    addService
    // hubRegistration,
    // getHubDetails,
    // deleteHub,
}