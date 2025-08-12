const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const WooCommerce = new WooCommerceRestApi({
    url: process.env.WOOCOMMERCE_URL,
    consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
    consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
    version: 'wc/v3',
  });

  module.exports=WooCommerce