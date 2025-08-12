const Order = require("../models/newOrder.model");
const Plan = require("../models/Plan.model");
const rateCards = require("../models/rateCards");
const users=require("../models/User.model")
const wallet=require("../models/wallet")
const zoneManagementController = require("../Rate/zoneManagementController");
const getZone = zoneManagementController.getZone;
const rtoCharges = async (req, res) => {
  try {
    const gstRate = 18;
    const order = await Order.find({
      // userId: userID,
      status: "RTO Delivered",
      RTOCharges: { $exists: false },
    });

    await Promise.all(order.map(async (item) => {
      let result = await getZone(
        item.pickupAddress.pinCode,
        item.receiverAddress.pinCode
      );
      let currentZone = result.zone;
      const plans = await Plan.findOne({ userId: item.userId });
      const ratecards = await rateCards.findOne({
        plan: plans.planName,
        courierServiceName: item.courierServiceName,
      });
      const extraWeight =
        item.packageDetails.applicableWeight * 1000 -
        ratecards.weightPriceBasic[0].weight;
      const extraWeightCount = Math.ceil(
        extraWeight / ratecards.weightPriceAdditional[0].weight
      );

      let basicChargef = parseFloat(ratecards.weightPriceBasic[0][currentZone]);
      let charges = basicChargef;

      if (extraWeight !== 0) {
        charges +=
          parseFloat(ratecards.weightPriceAdditional[0][currentZone]) *
          extraWeightCount;
      }

      let codCharges = 0;
      if (item.paymentDetails.method === "COD") {
        let calculatedCodCharge = Math.max(
          ratecards.codCharge,
          item.paymentDetails.amount * (ratecards.codPercent / 100)
        );
        codCharges += calculatedCodCharge;
      }
    
      const gstAmountForward = parseFloat((charges * (gstRate / 100)).toFixed(2));
      const totalChargesRevrse = charges + gstAmountForward;
      const Users= await users.findOne({_id:item.userId})
      const Wallet=await wallet.findOne({_id:Users.Wallet})
      await Order.updateOne(
        { _id: item._id },
        { $set: { RTOCharges: totalChargesRevrse.toFixed(2) } }
      );
     
      await Wallet.updateOne({
        $inc: { balance: codCharges },
        $push: {
          transactions: {
            channelOrderId: item.orderId || null, 
            category: "credit",
            amount: codCharges, 
            balanceAfterTransaction: Wallet.balance + codCharges,
            date: new Date().toISOString().slice(0, 16).replace("T", " "), 
            awb_number: item.awb_number || "",
            description: `Cod Charges Reversed`,
          },
        },
      });
      await Wallet.updateOne({
        $inc: { balance: -totalChargesRevrse },
        $push: {
          transactions: {
            channelOrderId: item.orderId || null, 
            category: "debit",
            amount: totalChargesRevrse, 
            balanceAfterTransaction: Wallet.balance - totalChargesRevrse,
            date: new Date().toISOString().slice(0, 16).replace("T", " "), 
            awb_number: item.awb_number || "",
            description: ` RTO Freight Charges Applied`,
          },
        },
      });
    }));

    // res.status(200).json({ message: "RTO charges calculated." });
  } catch (error) {
    console.error("Error in rtoCharges:", error);
    // res.status(500).json({ message: "Internal server error." });
  }
};

cron.schedule("0 */3 * * *", () => {
  console.log("Running scheduled task every 3 hours: Fetching orders...");
  rtoCharges();
});



// module.exports = {
//   rtoCharges,
// };
