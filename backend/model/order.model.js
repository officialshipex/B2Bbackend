const mongoose = require("mongoose");

// const productSchema = new mongoose.Schema({
//   productName: { type: String, require: true },
//   quantity: { type: Number, require: true },
//   unitPrice: { type: Number, require: true },
//   SKU: { type: String },
//   HSN: { type: String },
//   taxRate: { type: Number },
//   productCategory: { type: String},
//   discount: { type: Number, default: 0}
// });

const addressSchema = new mongoose.Schema({
  addressLine: {
    type: String,
    require: true
  },
  city: {
    type: String,
    require: true
  },
  state: {
    type: String,
    require: true
  },
  country: {
    type: String,
    require: true,
    default: "India"
  },
  pincode: {
    type: String,
    require: true
  },
});

const orderSchema = new mongoose.Schema({
  buyerDetails: {
    buyerName: {
      type: String,
      require: true,
    },
    phoneNumber: {
      type: String,
      require: true,
    },
    alternatePhoneNumber: {
      type: String,
    },
    email: {
      type: String,
      require: true,
    },
  },
  buyerAddress: {
    completeAddress: {
      type: String,
      require: true,
    },
    landmark: {
      type: String,
    },
    pincode: {
      type: String,
      require: true,
    },
    city: {
      type: String,
      require: true,
    },
    state: {
      type: String,
      require: true,
    },
    country: {
      type: String,
      default: "India",
    },
    companyName: {
      type: String,
    },
    gstinNumber: {
      type: String,
    },
    billingAddressSameAsShipping: {
      type: Boolean,
      default: false,
    },
  },
  orderDetails: {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    orderType: {
      type: String,
      require: true,
    },
    orderDate: {
      type: Date,
      require: true,
    },
    shippingCharges: { type:Number },
    giftWrap: { type:Number },
    transaction: { type:Number },
    additionalDiscount: { type:Number },
    subTotal: { type:Number },
    otherCharges: { type:Number },
    totalOrderValue: { type:Number },
  },
  productDetails: [productSchema],
  payment:{
    PaymentMethod:{
        type: String,
        enum: ['COD', 'Prepaid'],
        required: true
      }
  },
  packageDetails: {
    weigth: {
      type: Number,
      require: true,
    },
    volumetricWeigth: {
      type: Number,
      default: 0,
    },
  },
  pickUpAddress: {
    primary: addressSchema,
    additionalAddresses: [addressSchema],
  },
});

const Orders = mongoose.model("Orders", orderSchema);

module.exports = Orders;


// const mongoose = require("mongoose");

// // Product Schema
// const productSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   quantity: { type: Number, required: true },
//   unitPrice: { type: Number, required: true },
//   SKU: { type: String },
//   HSN: { type: String },
//   taxRate: { type: Number },
//   category: { type: String },
//   discount: { type: Number, default: 0 },
// });

// // Address Schema
// const addressSchema = new mongoose.Schema({
//   line: { type: String, required: true },
//   city: { type: String, required: true },
//   state: { type: String, required: true },
//   country: { type: String, required: true, default: "India" },
//   pincode: { type: String, required: true },
// });

// // Buyer Details Schema
// const buyerDetailsSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   phone: { type: String, required: true },
//   alternatePhone: { type: String },
//   email: { type: String, required: true },
// });

// // Buyer Address Schema
// const buyerAddressSchema = new mongoose.Schema({
//   address: { type: String, required: true },
//   landmark: { type: String },
//   pincode: { type: String, required: true },
//   city: { type: String, required: true },
//   state: { type: String, required: true },
//   country: { type: String, default: "India" },
//   companyName: { type: String },
//   gstin: { type: String },
//   billingSameAsShipping: { type: Boolean, default: false },
// });

// // Order Details Schema
// const orderDetailsSchema = new mongoose.Schema({
//   id: { type: String, required: true, unique: true },
//   type: { type: String, required: true },
//   date: { type: Date, required: true },
//   shippingCharges: { type: Number, default: 0 },
//   giftWrap: { type: Number, default: 0 },
//   transactionFees: { type: Number, default: 0 },
//   additionalDiscount: { type: Number, default: 0 },
//   subTotal: { type: Number, default: 0 },
//   otherCharges: { type: Number, default: 0 },
//   totalValue: { type: Number, default: 0 },
// });

// // Package Details Schema
// const packageDetailsSchema = new mongoose.Schema({
//   weight: { type: Number, required: true },
//   volumetricWeight: { type: Number, default: 0 },
// });

// // Order Schema
// const orderSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   buyerDetails: buyerDetailsSchema,
//   buyerAddress: buyerAddressSchema,
//   orderDetails: orderDetailsSchema,
//   productDetails: [productSchema],
//   payment: {
//     method: {
//       type: String,
//       enum: ["COD", "Prepaid"],
//       required: true,
//     },
//   },
//   packageDetails: packageDetailsSchema,
//   pickupAddress: {
//     primary: addressSchema,
//     additional: [addressSchema],
//   },
// });

// const Orders = mongoose.models.Order || mongoose.model("Order", orderSchema);

// module.exports = Orders;