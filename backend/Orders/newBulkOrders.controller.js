const Services = require("../models/CourierService.Schema");
const Courier = require("../models/AllCourierSchema");
const Order = require("../models/newOrder.model");
const plan = require("../models/Plan.model");
const User = require("../models/User.model");
const { checkServiceabilityAll } = require("./shipment.controller");
const Wallet = require("../models/wallet");
const { AutoShip } = require("./AutoShipB2c.controller");
const {
  calculateRateForService,
  calculateRateForServiceBulk,
} = require("../Rate/calculateRateController");

const {
  createShipmentFunctionDelhivery,
} = require("../AllCouriers/Delhivery/Courier/bulkShipment.controller");
const {
  createShipmentFunctionEcomExpress,
} = require("../AllCouriers/EcomExpress/Couriers/bulkShipment.controller");
const {
  createOrderDTDC,
} = require("../AllCouriers/DTDC/Courier/bulkShipment.controller");
const {
  createShipmentAmazon,
} = require("../AllCouriers/Amazon/Courier/bulkShipment.controller");
const updatePickup = async (req, res) => {
  try {
    // console.log(req.body)
    const { formData, setSelectedData } = req.body;
    console.log(formData, setSelectedData);

    if (!setSelectedData || !formData) {
      res
        .status(400)
        .json({ success: false, message: "id and pickup address not found" });
    }
    await Promise.all(
      setSelectedData.map(async (orderId) => {
        await Order.findByIdAndUpdate(orderId, {
          $set: { pickupAddress: formData },
        });
      })
    );
    res.status(200).json({ success: true, message: "Internal server error" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const createShipment = async (serviceDetails, order, wh, walletId, charges) => {
  // console.log("create shipement",serviceDetails,order,wh,walletId,charges)
  try {
    let result;

    switch (serviceDetails.provider) {
      case "NimbusPost":
        result = await createShipmentFunctionNimbusPost(
          serviceDetails,
          order._id,
          wh,
          walletId,
          charges
        );
        break;
      case "Amazon":
        result = await createShipmentAmazon(
          serviceDetails,
          order._id,
          wh,
          walletId,
          charges
        );
        break;
      // case "Shiprocket":
      //   result = await createShipmentFunctionShipRocket(
      //     serviceDetails,
      //     order._id,
      //     wh,
      //     walletId,
      //     charges
      //   );
      //   break;
      // case "Xpressbees":
      //   result = await createShipmentFunctionXpressBees(
      //     serviceDetails,
      //     order._id,
      //     wh,
      //     walletId,
      //     charges
      //   );
      //   break;
      case "Delhivery":
        result = await createShipmentFunctionDelhivery(
          serviceDetails,
          order._id,
          wh,
          walletId,
          charges
        );
        break;
      case "EcomExpress":
        result = await createShipmentFunctionEcomExpress(
          serviceDetails,
          order._id,
          wh,
          walletId,
          charges
        );
        break;
      case "DTDC":
        result = await createOrderDTDC(
          serviceDetails,
          order._id,
          wh,
          walletId,
          charges
        );
        break;
      case "ShreeMaruti":
        result = await createShipmentFunctionShreeMaruti(
          serviceDetails,
          order._id,
          wh,
          walletId,
          charges
        );
        break;
      default:
        console.error(
          `No function defined for ${serviceDetails.courierProviderName}`
        );
        return false;
    }
    console.log("resuuuulllltttt", result);
    return result?.status === 200 || result?.status === 201 || result?.success;
  } catch (error) {
    console.error(`Error creating shipment:`, error);
    return false;
  }
};
const shipBulkOrder = async (req, res) => {
  try {
    //   const { id, pincode, plan, isBulkShip } = req.body;
    const { selectedOrders, pinCode } = req.body;
    // console.log(pinCode)
    const userID = req.user._id;
    const plans = await plan.find({ userId: userID });
    //  console.log("9999999999,",plans)
    const servicesCursor = await Services.find({ status: "Enable" });

    const enabledServices = [];

    for await (const srvc of servicesCursor) {
      const provider = await Courier.findOne({
        courierProvider: srvc.provider,
      });
      // console.log("7777777777",provider)
      if (provider?.status === "Enable") {
        enabledServices.push(srvc);
      }
    }

    const availableServices = await Promise.all(
      selectedOrders.map(async (item) => {
        const serviceable = await Promise.all(
          enabledServices.map(async (svc) => {
            const result = await checkServiceabilityAll(svc, item, pinCode);
            return result ? svc : null;
          })
        );
        return serviceable.filter(Boolean);
      })
    );
    // console.log("avail",availableServices)
    // console.log("enabled",enabledServices)
    const flattenedAvailableService = [...new Set(availableServices.flat())];
    // console.log(flattenedAvailableService)

    const fplans = plans.flatMap((plan) =>
      plan.rateCard.map((item) => item.courierServiceName)
    );

    // console.log(fplans)

    const flattenedAvailableServices = flattenedAvailableService.filter(
      (item) => fplans.includes(item.name)
    );

    // console.log(flattenedAvailableServices); // Only matched services will be returned

    // console.log(flattenedAvailableServices);

    res.status(201).json({
      success: true,
      services: flattenedAvailableServices,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
      error: error.message,
    });
  }
};

const createBulkOrder = async (req, res) => {
  // console.log("Bulk order creation initiated");
  // console.log(req.user._id);
  const { item, selectedOrders, wh } = req.body;
  let successCount = 0;
  let failureCount = 0;
  const userId = req.user._id;
  const user = await User.findOne({ _id: userId });
  const walletId = user.Wallet;
  const wallet = await Wallet.findOne({ _id: user.Wallet });

  // console.log("999999",wallet)
  // const { walletId, availableServices, userId } = req.body;
  // const { selectedServiceDetails, id, wh } = req.body.payload;

  // const servicesToBeConsidered = availableServices.filter(
  //   (item) => item.courierProviderServiceName !== "AutoShip"
  // );

  const remainingOrders = [...selectedOrders];

  try {
    // if (!Array.isArray(id) || id.length === 0) {
    //   return res
    //     .status(400)
    //     .json({ error: "No orders provided for bulk creation." });
    // }

    if (item) {
      // console.log("item");
      const autoShipPromises = selectedOrders.map(async (order) => {
        // const priorityServices = await AutoShip(order, wh, userId);

        // if (priorityServices.length > 0) {
        // const validPriorityServices = priorityServices;
        // .sort((a, b) => a.priority - b.priority)
        // .filter((service) =>
        //   servicesToBeConsidered.some(
        //     (availableService) =>
        //       availableService.courierProviderServiceName ===
        //       service.courierProviderServiceName
        //   )
        // );
        const orderDetails = await Order.findOne({ _id: order });

        // for (let service of validPriorityServices) {
        try {
          // const isServiceable = await checkServiceabilityAll(
          //   item,
          //   order,
          //   `${wh.pinCode}`
          // );
          // if (!isServiceable) {
          //   continue;
          // }

          // Calculate charges before creating the shipment
          const details = {
            pickupPincode: `${wh.pinCode}`,
            deliveryPincode: `${orderDetails.receiverAddress.pinCode}`,
            length: orderDetails.packageDetails.volumetricWeight.length,
            breadth: orderDetails.packageDetails.volumetricWeight.width,
            height: orderDetails.packageDetails.volumetricWeight.height,
            weight: orderDetails.packageDetails.applicableWeight,
            cod: orderDetails.paymentDetails.method === "COD" ? "Yes" : "No",
            valueInINR: orderDetails.paymentDetails.amount,
            userID: userId,
            filteredServices: item,
          };

          const rates = await calculateRateForServiceBulk(details);
          // console.log("rtfdd", rates);
          const charges = parseInt(rates[0]?.forward?.finalCharges);
          // console.log(charges)

          if (!charges) {
            throw new Error("Invalid charges calculated.");
          }

          const result = await createShipment(
            item,
            orderDetails,
            wh,
            walletId,
            charges
          );
          console.log("resulttte", result);
          if (result) {
            successCount++;
            remainingOrders.splice(remainingOrders.indexOf(order), 1);
            // break;
          }
        } catch (error) {
          console.error(`Error processing AutoShip order ${order._id}:`, error);
        }
        // }
        // }
      });

      await Promise.all(autoShipPromises);

      // Handle fallback for remaining orders
      // if (remainingOrders.length > 0) {
      //   const fallbackPromises = remainingOrders.map(async (order) => {
      //     let shipmentCreated = false;

      //     for (let service of servicesToBeConsidered) {
      //       try {
      //         const isServiceable = await checkServiceabilityAll(
      //           service,
      //           order,
      //           `${wh.pinCode}`
      //         );

      //         if (isServiceable) {
      //           const result = await createShipment(
      //             service,
      //             order,
      //             wh,
      //             walletId,
      //             selectedServiceDetails
      //           );

      //           if (result?.status === 200) {
      //             successCount++;
      //             shipmentCreated = true;
      //             remainingOrders.splice(remainingOrders.indexOf(order), 1);
      //             break;
      //           } else {
      //             console.warn(
      //               `Shipment creation failed for order ${order._id} with service ${service.courierProviderName}.`
      //             );
      //           }
      //         }
      //       } catch (error) {
      //         console.error(
      //           `Error checking serviceability for order ${order._id} with service ${service.courierProviderName}:`,
      //           error
      //         );
      //       }
      //     }

      //     if (!shipmentCreated) {
      //       failureCount++;
      //       console.warn(`No serviceable option found for order ${order._id}.`);
      //     }
      //   });

      //   await Promise.all(fallbackPromises);
      // }

      return res.status(201).json({
        message: `${successCount} orders created successfully & ${failureCount} failed.`,
        successCount,
        failureCount,
        remainingOrdersCount: remainingOrders.length,
        remainingOrders,
      });
    }

    // Handle non-AutoShip orders
    const orderPromises = id.map(async (order) => {
      const details = {
        pickupPincode: `${wh.pinCode}`,
        deliveryPincode: `${order.shipping_details.pinCode}`,
        length: order.shipping_cost.dimensions.length,
        breadth: order.shipping_cost.dimensions.width,
        height: order.shipping_cost.dimensions.height,
        weight: order.shipping_cost.weight,
        cod: order.order_type === "Cash on Delivery" ? "Yes" : "No",
        valueInINR: order.sub_total,
        filteredServices: [selectedServiceDetails],
        rateCardType: req.body.plan,
      };

      try {
        const rates = await calculateRateForService(details);
        const charges = parseInt(rates[0]?.forward?.finalCharges);
        // const charges=70;

        if (!charges) {
          throw new Error("Invalid charges calculated.");
        }

        const result = await createShipment(
          selectedServiceDetails,
          order,
          wh,
          walletId,
          charges
        );

        console.log("Bulk Shipment Result is:", result);

        if (result) {
          successCount++;
          remainingOrders.splice(remainingOrders.indexOf(order), 1);
        } else {
          failureCount++;
        }
      } catch (error) {
        console.error(`Error processing order ${order._id}:`, error);
        failureCount++;
      }
    });

    await Promise.all(orderPromises);

    return res.status(201).json({
      message: `${successCount} orders created successfully & ${failureCount} failed.`,
      successCount,
      failureCount,
      remainingOrdersCount: remainingOrders.length,
      remainingOrders,
    });
  } catch (error) {
    console.error("Error in creating bulk orders:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
      successCount,
      failureCount,
      remainingOrdersCount: remainingOrders.length,
      remainingOrders,
    });
  }
};

module.exports = {
  updatePickup,
  shipBulkOrder,
  createBulkOrder,
};
