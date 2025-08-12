const Order = require("../models/newOrder.model");
const {
  getServiceablePincodesData,
} = require("../AllCouriers/NimbusPost/Couriers/couriers.controller");
const {
  checkServiceability,
} = require("../AllCouriers/ShipRocket/MainServices/mainServices.controller");
const {
  checkServiceabilityXpressBees,
} = require("../AllCouriers/Xpressbees/MainServices/mainServices.controller");
const {
  checkPincodeServiceabilityDelhivery,
} = require("../AllCouriers/Delhivery/Courier/couriers.controller");
const {
  checkServiceabilityShreeMaruti,
} = require("../AllCouriers/ShreeMaruti/Couriers/couriers.controller");
const {checkServiceabilityEcomExpress}=require("../AllCouriers/EcomExpress/Couriers/couriers.controllers")
const {checkAmazonServiceability}=require("../AllCouriers/Amazon/Courier/couriers.controller")
const {checkServiceabilityDTDC}=require("../AllCouriers/DTDC/Courier/couriers.controller")


const checkServiceabilityAll = async (service, id, pincode) => {
  try {
// console.log("kkkkkkkkkkk",service, id, pincode)
    const currentOrder = await Order.findById(id);
    if (!currentOrder) throw new Error("Order not found");

    // console.log("ser",service)

    
// console.log(currentOrder)
    // console.log("pincode",pincode);
    // if (service.provider === "NimbusPost") {
    //     const payload = {
    //         origin: pincode,
    //         destination: currentOrder.receiverAddress?.pinCode || "",
    //         payment_type: currentOrder.paymentDetails?.method === "COD" ? "cod" : "prepaid",
    //         order_amount: currentOrder.paymentDetails?.amount || 0,
    //         weight: currentOrder.packageDetails?.applicableWeight || 0,
    //         length: currentOrder.packageDetails.volumetricWeight?.length || 0,
    //         breadth: currentOrder.packageDetails.volumetricWeight?.width || 0,
    //         height: currentOrder.packageDetails.volumetricWeight?.height || 0
            
    //       };
    // //   console.log("Paylod is");

    //   const result = await getServiceablePincodesData(
    //     service.courier,
    //     payload
    //   );
    // //   console.log("das",result);

    //   return result;
    // }
    const weight= (currentOrder.packageDetails?.applicableWeight)*1000
    if (service.provider === "Xpressbee") {
      const payload = {
        origin: pincode,
        destination:currentOrder.receiverAddress?.pinCode || "",
        payment_type:currentOrder.paymentDetails?.method === "COD" ? "cod" : "prepaid",
        order_amount: currentOrder.paymentDetails?.amount || 0,
        weight: weight || 0,
        length:currentOrder.packageDetails.volumetricWeight?.length || 0,
        breadth: currentOrder.packageDetails.volumetricWeight?.width || 0,
        height: currentOrder.packageDetails.volumetricWeight?.height || 0
      };

      const result = await checkServiceabilityXpressBees(
        service.courier,
        payload
      );
      // console.log("sddddddddddddd",result)
      return result;
      // console.log("4621516dsfds",result)
    }
    // // if (service.courierProviderName === "Shiprocket") {
    //   const payload = {
    //     origin: pincode,
    //     destination: currentOrder.shipping_details.pinCode,
    //     payment_type:
    //       currentOrder.order_type === "Cash on Delivery" ? true : false,
    //     weight: `${parseInt(currentOrder.shipping_cost.weight) / 1000}`,
    //     length: currentOrder.shipping_cost.dimensions.length,
    //     breadth: currentOrder.shipping_cost.dimensions.width,
    //     height: currentOrder.shipping_cost.dimensions.height,
    //   };

    //   const result = await checkServiceability(
    //     service.courierProviderServiceName,
    //     payload
    //   );
    //   return result;
    // }

    if (service.provider === "Amazon") {
      // console.log("orderer",currentOrder)
    
      const payload = {
        orderId:currentOrder.orderId,
        origin: currentOrder.pickupAddress,
        destination:currentOrder.receiverAddress,
        payment_type:currentOrder.paymentDetails?.method,
        order_amount: currentOrder.paymentDetails?.amount || 0,
        weight: weight || 0,
        length:currentOrder.packageDetails.volumetricWeight?.length || 0,
        breadth: currentOrder.packageDetails.volumetricWeight?.width || 0,
        height: currentOrder.packageDetails.volumetricWeight?.height || 0,
        productDetails:currentOrder.productDetails,
        orderId:currentOrder.orderId
      };



      const result = await checkAmazonServiceability(
        service.provider,
        payload
      );
      return result;
    }

    if (service.provider === "Delhivery") {
      
      const result = await checkPincodeServiceabilityDelhivery(
        
        currentOrder.receiverAddress.pinCode,
        currentOrder.paymentDetails?.method === "COD" ? "cod" : "prepaid"
      );
      // console.log("saaaaaaaaaaaaa",result)
      return result;
    }

    if (service.provider === "ShreeMarut") {
      const payload = {
        fromPincode: parseInt(pincode),
        toPincode: parseInt(currentOrder.receiverAddress.pinCode),
        isCodOrder:
          currentOrder.paymentDetails?.method === "COD" ? true : false,
        deliveryMode: "SURFACE",
      };
      const result = await checkServiceabilityShreeMaruti(payload);
      // console.log("resultttt",result)
      return result;
    }

    if (service.provider === "EcomExpres") {
      const payload = {
        originPincode: pincode, // Pickup location pincode
        destinationPincode: currentOrder.receiverAddress.pinCode, // Delivery location pincode
      };
    
      const result = await checkServiceabilityEcomExpress(payload.originPincode, payload.destinationPincode);
      // console.log("Serviceability Result:", result);
      return result;
    }
    if(service.provider==="DTDC"){
      const payload={
        originPincode:pincode,
        destinationPincode:currentOrder.receiverAddress.pinCode
      }
      const result=await checkServiceabilityDTDC(payload.originPincode, payload.destinationPincode)
      console.log("rerere",result)
      return result
    }
    

    // return false;
  } catch (error) {
    console.error("Error in checking serviceability:", error.message);
    // throw error;
  }
};

module.exports = { checkServiceabilityAll };
