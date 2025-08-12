const RateCard = require("../models/rateCards.js");
const zoneManagementController = require("./zoneManagementController.js");
const getZone = zoneManagementController.getZone;
const Plan = require("../models/Plan.model.js");
const {
  checkServiceabilityEcomExpress,
} = require("../AllCouriers/EcomExpress/Couriers/couriers.controllers.js");
const {
  checkPincodeServiceabilityDelhivery,
} = require("../AllCouriers/Delhivery/Courier/couriers.controller.js");
const {
  checkServiceabilityDTDC,
} = require("../AllCouriers/DTDC/Courier/couriers.controller.js");

const calculateRate = async (req, res) => {
  try {
    const id = req.user._id;
    const {
      pickUpPincode,
      deliveryPincode,
      applicableWeight,
      paymentType,
      declaredValue,
    } = req.body;
    console.log(
      pickUpPincode,
      deliveryPincode,
      applicableWeight,
      paymentType,
      declaredValue
    );

    let result = await getZone(pickUpPincode, deliveryPincode);
    let currentZone = result.zone;
    const plan = await Plan.findOne({ userId: id });
    let rateCards = plan.rateCard;
    const order_type = paymentType === "COD" ? "cod" : "prepaid";

    let ans = [];
    const chargedWeight = applicableWeight * 1000;
    const gst = 18;
    // console.log("rate",rateCards)

    for (let rc of rateCards) {
      const provider = rc.courierProviderName;
      const mode = rc.mode;
      let serviceable;

      if (!["EcomExpres", "Delhivery", "DTDC"].includes(provider)) {
        continue;
      }

      // Check serviceability per provider
      if (provider === "EcomExpres") {
        serviceable = await checkServiceabilityEcomExpress(
          pickUpPincode,
          deliveryPincode
        );
        console.log("ecom", serviceable);
      } else if (provider === "Delhivery") {
        serviceable = await checkPincodeServiceabilityDelhivery(
          deliveryPincode,
          order_type
        );
        console.log("dele", serviceable);
      } else if (provider === "DTDC") {
        serviceable = await checkServiceabilityDTDC(
          pickUpPincode,
          deliveryPincode
        );
        console.log("check", serviceable);
      }

      // if (!isServiceable) continue; // Skip if not serviceable

      if (serviceable.success === false) {
        continue;
      }

      let basicCharge = parseFloat(rc.weightPriceBasic[0][currentZone]);
      let additionalCharge = parseFloat(
        rc.weightPriceAdditional[0][currentZone]
      );

      let finalCharge;
      const count = Math.ceil(
        (chargedWeight - rc.weightPriceBasic[0].weight) /
          rc.weightPriceAdditional[0].weight
      );

      if (rc.weightPriceBasic[0].weight >= chargedWeight) {
        finalCharge = basicCharge;
      } else {
        finalCharge = basicCharge + additionalCharge * count;
      }

      let cod = 0;
      if (paymentType === "COD") {
        const orderValue = Number(declaredValue) || 0;
        if (
          typeof rc.codCharge === "number" &&
          typeof rc.codPercent === "number"
        ) {
          cod = Math.max(rc.codCharge, orderValue * (rc.codPercent / 100));
        }
      }

      let gstAmount = Number(((finalCharge + cod) * gst) / 100).toFixed(2);
      let totalCharges = Math.round(finalCharge + cod + parseFloat(gstAmount));

      ans.push({
        courierServiceName: rc.courierServiceName,
        provider,
        mode,
        cod,
        forward: {
          charges: finalCharge,
          gst: gstAmount,
          finalCharges: totalCharges,
        },
      });
    }

    res.status(201).json(ans);
  } catch (error) {
    console.error("Error in Calculation:", error);
    res.status(500).json({ error: "Error in Calculation" });
  }
};

async function calculateRateForService(payload) {
  try {
    const {
      pickupPincode,
      deliveryPincode,
      length,
      breadth,
      height,
      weight,
      cod,
      valueInINR,
      userID,
      filteredServices,
      // rateCardType,
    } = payload;

    const result = await getZone(pickupPincode, deliveryPincode);

    const currentZone = result.zone;

    const ans = [];
    const l = parseFloat(length);
    const b = parseFloat(breadth);
    const h = parseFloat(height);
    const deadweight = parseFloat(weight) / 1000;
    const volumetricWeight = (l * b * h) / 5000;
    const chargedWeight = weight * 1000;

    // let codCharge = 0;
    const gstRate = 18;

    // const rateCards = [];
    const plan = await Plan.findOne({ userId: userID });
    let RateCards = plan.rateCard;

    for (const rc of RateCards) {
      const basicChargeForward = parseFloat(
        rc.weightPriceBasic[0][currentZone]
      );
      const additionalChargeForward = parseFloat(
        rc.weightPriceAdditional[0][currentZone]
      );

      let totalForwardCharge;
      const count = Math.ceil(
        (chargedWeight - rc.weightPriceBasic[0].weight) /
          rc.weightPriceAdditional[0].weight
      );
      if (rc.weightPriceBasic[0].weight >= chargedWeight) {
        totalForwardCharge = basicChargeForward;
      } else if (rc.weightPriceBasic[0].weight < chargedWeight) {
        totalForwardCharge =
          basicChargeForward + additionalChargeForward * count;
      }
      let codCharge = 0;
      if (cod === "Yes") {
        const orderValue = Number(valueInINR) || 0;
        if (
          typeof rc.codCharge === "number" &&
          typeof rc.codPercent === "number"
        ) {
          const calculatedCodCharge = Math.max(
            rc.codCharge,
            orderValue * (rc.codPercent / 100)
          );
          codCharge += calculatedCodCharge;
        } else {
          console.error("COD charge or percentage is not properly defined.");
        }
      }

      const gstAmountForward = (
        (totalForwardCharge + codCharge) *
        (gstRate / 100)
      ).toFixed(2);
      const totalChargesForward = (
        totalForwardCharge +
        codCharge +
        (totalForwardCharge + codCharge) * (gstRate / 100)
      ).toFixed(2);

      const allRates = {
        courierServiceName: rc.courierServiceName,
        cod: codCharge,
        forward: {
          charges: totalForwardCharge,
          gst: gstAmountForward,
          finalCharges: totalChargesForward,
        },
      };

      ans.push(allRates);
    }
    // console.log("0000000", ans);
    return ans;
  } catch (error) {
    console.error("Error in Calculation:", error);
    throw new Error("Error in Calculation");
  }
}

async function calculateRateForDispute(payload) {
  try {
    const {
      pickupPincode,
      deliveryPincode,
      weight, // extra weight in KG
      cod,
      valueInINR,
      userID,
      filteredServices,
    } = payload;

    const gstRate = 18;

    // Parallel fetch: zone + plan
    const [zoneResult, plan] = await Promise.all([
      getZone(pickupPincode, deliveryPincode),
      Plan.findOne({ userId: userID }),
    ]);

    if (!zoneResult || !zoneResult.zone) {
      throw new Error("Zone information could not be determined");
    }

    const currentZone = zoneResult.zone;

    if (!plan) {
      throw new Error("Rate card not found for user");
    }

    const RateCards = plan.rateCard || [];

    const services = RateCards.filter(
      (rate) => rate.courierServiceName === filteredServices
    );

    if (services.length === 0) {
      throw new Error("No matching service found");
    }

    // Convert extra weight from KG to grams
    const extraWeightInGrams = Math.ceil(parseFloat(weight) * 1000); // e.g., 2.88 kg → 2880 g

    const ans = [];

    for (const rc of services) {
      const additionalRate = rc.weightPriceAdditional?.[0];
      if (
        !additionalRate ||
        !additionalRate.weight ||
        !additionalRate[currentZone]
      ) {
        console.warn(
          `Skipping service ${rc.courierServiceName} due to missing rate info`
        );
        continue;
      }

      const additionalWeight = additionalRate.weight; // in grams
      const additionalCharge = parseFloat(additionalRate[currentZone]); // per slab

      const count = Math.ceil(extraWeightInGrams / additionalWeight);
      let totalForwardCharge = count * additionalCharge;
      totalForwardCharge = parseFloat(totalForwardCharge.toFixed(2));

      let codCharge = 0;
      if (cod === "Yes") {
        const orderValue = Number(valueInINR) || 0;
        if (
          typeof rc.codCharge === "number" &&
          typeof rc.codPercent === "number"
        ) {
          const calculatedCodCharge = Math.max(
            rc.codCharge,
            orderValue * (rc.codPercent / 100)
          );
          codCharge = parseFloat(calculatedCodCharge.toFixed(2));
        } else {
          console.warn("COD charge or percent not properly defined.");
        }
      }

      const gstAmountForward = parseFloat(
        ((totalForwardCharge + codCharge) * (gstRate / 100)).toFixed(2)
      );
      const totalChargesForward = parseFloat(
        (totalForwardCharge + codCharge + gstAmountForward).toFixed(2)
      );

      const allRates = {
        courierServiceName: rc.courierServiceName,
        cod: codCharge,
        forward: {
          charges: totalForwardCharge,
          gst: gstAmountForward,
          finalCharges: totalChargesForward,
        },
      };

      ans.push(allRates);
    }

    return ans;
  } catch (error) {
    console.error("Error in calculateRateForDispute:", error);
    throw new Error("Calculation failed");
  }
}

async function calculateRateForServiceBulk(payload) {
  try {
    const {
      pickupPincode,
      deliveryPincode,
      length,
      breadth,
      height,
      weight,
      cod,
      valueInINR,
      userID,
      filteredServices,
      // rateCardType,
    } = payload;
    console.log("9999999999", filteredServices);
    const result = await getZone(pickupPincode, deliveryPincode);

    const currentZone = result.zone;

    const ans = [];
    const l = parseFloat(length);
    const b = parseFloat(breadth);
    const h = parseFloat(height);
    const deadweight = parseFloat(weight) / 1000;
    const volumetricWeight = (l * b * h) / 5000;
    const chargedWeight = weight * 1000;

    // let codCharge = 0;
    const gstRate = 18;

    // const rateCards = [];
    const plan = await Plan.findOne({ userId: userID });
    let RateCards = plan.rateCard;

    // for (rc of RateCards) {
    //   let currentRate = await RateCard.findOne({
    //     courierProviderName: fls.item.provider,
    //     courierServiceName: fls.item.name,
    //   });
    //   rateCards.push(currentRate);
    // }
    // const finalRate = rateCards.filter(Boolean);

    for (const rc of RateCards) {
      // const basicWeight = parseFloat(rc.weightPriceBasic[0].weight);
      // const additionalWeight = parseFloat(rc.weightPriceAdditional[0].weight);

      // if(rc.courierServiceName==){
      const basicChargeForward = parseFloat(
        rc.weightPriceBasic[0][currentZone]
      );
      const additionalChargeForward = parseFloat(
        rc.weightPriceAdditional[0][currentZone]
      );

      let totalForwardCharge;
      const count = Math.ceil(
        (chargedWeight - rc.weightPriceBasic[0].weight) /
          rc.weightPriceAdditional[0].weight
      );
      if (rc.weightPriceBasic[0].weight >= chargedWeight) {
        totalForwardCharge = basicChargeForward;
      } else if (rc.weightPriceBasic[0].weight < chargedWeight) {
        totalForwardCharge =
          basicChargeForward + additionalChargeForward * count;
      }
      let codCharge = 0;
      if (cod === "Yes") {
        const orderValue = Number(valueInINR) || 0;
        if (
          typeof rc.codCharge === "number" &&
          typeof rc.codPercent === "number"
        ) {
          const calculatedCodCharge = Math.max(
            rc.codCharge,
            orderValue * (rc.codPercent / 100)
          );
          codCharge += calculatedCodCharge;
        } else {
          console.error("COD charge or percentage is not properly defined.");
        }
      }
      // }
      const gstAmountForward = (
        (totalForwardCharge + codCharge) *
        (gstRate / 100)
      ).toFixed(2);
      const totalChargesForward = (
        totalForwardCharge +
        codCharge +
        (totalForwardCharge + codCharge) * (gstRate / 100)
      ).toFixed(2);

      const allRates = {
        courierServiceName: rc.courierServiceName,
        cod: codCharge,
        forward: {
          charges: totalForwardCharge,
          gst: gstAmountForward,
          finalCharges: totalChargesForward,
        },
      };
      if (allRates.courierServiceName === filteredServices.name) {
        ans.push(allRates);
      }
      // ans.push(allRates);
    }
    // console.log("0000000", ans);
    return ans;
  } catch (error) {
    console.error("Error in Calculation:", error);
    throw new Error("Error in Calculation");
  }
}

module.exports = {
  calculateRate,
  calculateRateForService,
  calculateRateForServiceBulk,
  calculateRateForDispute,
};
