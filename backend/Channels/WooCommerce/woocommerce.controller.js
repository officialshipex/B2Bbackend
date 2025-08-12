const axios = require("axios");
const Order = require("../../models/newOrder.model");
const AllChannel = require("../allChannel.model"); // Adjust path if necessary

const storeURL="http://localhost/wordpress/wordpress";
const consumerKey="ck_9ce0ecc8e0602447215d5cfe42f297fd0cbf19cf";
const consumerSecret="cs_eb673ea166231c4a1c52c44543c9d595f9be32c6";

// Function to fetch orders from WooCommerce
const fetchWooCommerceOrders = async (
  storeURL,
  consumerKey,
  consumerSecret
) => {
  try {
    const response = await axios.get(`${storeURL}/wp-json/wc/v3/orders`, {
      auth: {
        username: consumerKey,
        password: consumerSecret,
      },
    });

    return response.data; // Returns orders from WooCommerce
  } catch (error) {
    console.error(
      "Error fetching WooCommerce orders:",
      error.response?.data || error
    );
    throw new Error("Failed to fetch orders from WooCommerce.");
  }
};
// fetchWooCommerceOrders(storeURL,consumerKey,consumerSecret)

//webhook creation
const checkExistingWooCommerceWebhooks = async (
  storeURL,
  consumerKey,
  consumerSecret
) => {
  try {
    const response = await axios.get(`${storeURL}/wp-json/wc/v3/webhooks`, {
      auth: {
        username: consumerKey,
        password: consumerSecret,
      },
    });

    return response.data; // Returns all existing webhooks
  } catch (error) {
    console.error(
      "❌ Error fetching WooCommerce webhooks:",
      error.response?.data || error
    );
    return [];
  }
};

const createWooCommerceWebhook = async (
  storeURL,
  consumerKey,
  consumerSecret
) => {
  try {
    // 🔍 Step 1: Check if a webhook already exists
    const existingWebhooks = await checkExistingWooCommerceWebhooks(
      storeURL,
      consumerKey,
      consumerSecret
    );

    // 🔄 Step 2: Filter Webhooks for our "Order Created" event
    const existingWebhook = existingWebhooks.find(
      (webhook) =>
        webhook.topic.includes("order") &&
        webhook.delivery_url ===
          "https://api.shipexindia.com/v1/channel/webhook/woocommerce"
    );

    if (existingWebhook) {
      console.log("✅ Webhook already exists:", existingWebhook);
      return existingWebhook; // Return existing webhook details
    }

    // 🚀 Step 3: Create new webhook if none exists
    const response = await axios.post(
      `${storeURL}/wp-json/wc/v3/webhooks`,
      {
        name: "Order Created Webhook",
        topic: "order.created",
        delivery_url:
          "https://api.shipexindia.com/v1/channel/webhook/woocommerce",
        status: "active",
      },
      {
        auth: {
          username: consumerKey,
          password: consumerSecret,
        },
      }
    );

    console.log("✅ Webhook created successfully:", response.data);
    return response.data; // Return newly created webhook details
  } catch (error) {
    console.error(
      "❌ Error creating WooCommerce webhook:",
      error.response?.data || error
    );
    throw new Error("Failed to create WooCommerce webhook.");
  }
};

//webhook handler

const wooCommerceWebhookHandler = async (req, res) => {
  try {
    console.log("Received WooCommerce Webhook:", req.body);
    const orderData = req.body;

    // Retrieve WooCommerce store details from the database
    const store = await AllChannel.findOne({ storeURL: orderData.store_url });
    if (!store) {
      return res.status(400).json({ error: "Store not found" });
    }

    let totalWeight = 0;
    let totalLength = 10,
      totalWidth = 10,
      totalHeight = 10;

    // Process line items and fetch product weight & dimensions
    const productDetails = await Promise.all(
      orderData.line_items.map(async (item) => {
        const productInfo = await getWooCommerceProductDetails(
          item.product_id,
          store.storeURL,
          store.storeClientId,
          store.storeClientSecret
        );

        // Accumulate total weight and dimensions
        totalWeight += parseFloat(productInfo.weight) || 0;
        totalLength = Math.max(
          totalLength,
          parseFloat(productInfo.length) || 10
        );
        totalWidth = Math.max(totalWidth, parseFloat(productInfo.width) || 10);
        totalHeight = Math.max(
          totalHeight,
          parseFloat(productInfo.height) || 10
        );

        return {
          id: item.id,
          quantity: item.quantity,
          name: item.name,
          sku: item.sku,
          unitPrice: item.price,
        };
      })
    );

    // Create and save the order in the database
    const newOrder = new Order({
      userId: orderData.customer_id,
      orderId: orderData.id,
      pickupAddress: {
        contactName:
          orderData.billing.first_name + " " + orderData.billing.last_name,
        email: orderData.billing.email,
        phoneNumber: orderData.billing.phone,
        address: `${orderData.billing.address_1}, ${orderData.billing.city}`,
        pinCode: orderData.billing.postcode,
        city: orderData.billing.city,
        state: orderData.billing.state,
      },
      receiverAddress: {
        contactName:
          orderData.shipping.first_name + " " + orderData.shipping.last_name,
        email: orderData.billing.email,
        phoneNumber: orderData.shipping.phone || "0000000000",
        address: orderData.shipping.address_1,
        pinCode: orderData.shipping.postcode,
        city: orderData.shipping.city,
        state: orderData.shipping.state,
      },
      productDetails, // Includes product details without weight
      packageDetails: {
        deadWeight: totalWeight, // Total weight of all products
        applicableWeight: totalWeight, // Can be adjusted later if needed
        volumetricWeight: {
          length: totalLength,
          width: totalWidth,
          height: totalHeight,
        },
      },
      paymentDetails: {
        method: orderData.payment_method_title || "Unknown",
        amount: orderData.total,
      },
      status: orderData.status,
    });

    await newOrder.save();

    res.status(200).json({ message: "WooCommerce order synced successfully." });
  } catch (error) {
    console.error("Error syncing WooCommerce order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//product details

const getWooCommerceProductDetails = async (
  productId,
  storeURL,
  consumerKey,
  consumerSecret
) => {
  try {
    const response = await axios.get(
      `${storeURL}/wp-json/wc/v3/products/${productId}`,
      {
        auth: {
          username: consumerKey,
          password: consumerSecret,
        },
      }
    );

    const product = response.data;
    return {
      weight: parseFloat(product.weight) || 0, // ✅ Corrected
      length: parseFloat(product.dimensions.length) || 10,
      width: parseFloat(product.dimensions.width) || 10,
      height: parseFloat(product.dimensions.height) || 10,
    };
  } catch (error) {
    console.error(
      "Error fetching WooCommerce product details:",
      error.response?.data || error
    );
    return { weight: 0, length: 10, width: 10, height: 10 }; // Default values
  }
};

module.exports = { wooCommerceWebhookHandler, createWooCommerceWebhook };
