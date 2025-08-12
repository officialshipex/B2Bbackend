const mongoose = require("mongoose");

const quickOrderSchema = new mongoose.Schema({
  pickupAddress: { type:String, required:true },
  buyerDetails: {
    name: { type:String, required:true },
    phoneNumber: { type:String, required:true  },
    alternatePhoneNumber: { type:String },
    email: { type:String, required:true  },
  },
  buyerAddress: {
    completeAddress: { type:String, required:true  },
    landmark: { type:String, required:true  },
    pincode: { type:String, required:true  },
    city: { type:String, required:true  },
    state: { type:String, required:true  },
    country: { type:String, required:true  },
    companyName: { type:String, required:true  },
    gstinNumber: { type:String, required:true  },
  },
  shippingAddress: {
    completeAddress: { type:String, required:true  },
    landmark:  { type:String, required:true  },
    pincode:  { type:String, required:true  },
    city:  { type:String, required:true  },
    state:  { type:String, required:true  },
    country:  { type:String, required:true  },
  },
  productDetails: [
    {
      productName:  { type:String, required:true  },
      quantity: { type:Number, required:true  },
      unitPrice: { type:Number, required:true  },
      category:  { type:String, required:true  },
    },
  ],
  packageDetails: {
    weight: { type:Number, required:true  },
    dimensions: {
      length: { type:Number, required:true  },
      breadth: { type:Number, required:true  },
      height: { type:Number, required:true },
    },
  },
  paymentMethod:  { type:String, required:true  },
});

module.exports = mongoose.model("quickOrder", quickOrderSchema);
