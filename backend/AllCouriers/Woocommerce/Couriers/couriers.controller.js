require('dotenv').config();
let WooCommerce=require("../Initialize/initialize.controller")


// Fetch Products
exports.getProducts = async (req, res) => {
  try {
    const response = await WooCommerce.get('products');
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a Product
exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;
    const response = await WooCommerce.post('products', productData);
    res.status(201).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Fetch Orders
exports.getOrders = async (req, res) => {
    try {
      const response = await WooCommerce.get('orders');
      res.status(200).json(response.data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Create an Order
  exports.createOrder = async (req, res) => {
    try {
      const orderData = req.body;
      const response = await WooCommerce.post('orders', orderData);
      res.status(201).json(response.data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };


  // Fetch Shipment Details for an Order
exports.getShipmentDetails = async (req, res) => {
    try {
      const orderId = req.params.id; // Order ID from URL params
      const response = await WooCommerce.get(`orders/${orderId}`);
      res.status(200).json({
        shipping: response.data.shipping,
        tracking: response.data.meta_data.filter(meta => meta.key === '_tracking_info'),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  // Update Tracking Information
  exports.updateTrackingInfo = async (req, res) => {
    try {
      const orderId = req.params.id; // Order ID from URL params
      const { trackingNumber, carrier } = req.body; // Tracking info from request body
  
      // Metadata structure for tracking information
      const metadata = [
        {
          key: '_tracking_info',
          value: {
            tracking_number: trackingNumber,
            carrier,
          },
        },
      ];
  
      const response = await WooCommerce.put(`orders/${orderId}`, {
        meta_data: metadata,
      });
  
      res.status(200).json({
        message: 'Tracking information updated successfully',
        data: response.data,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };