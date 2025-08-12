const BaseRate = require("../models/baseRateCard.model");
const CustomRate = require("../models/CustomRate");
const RateCard = require("../models/rateCards");

const editBaseRate = async (prevCard, newCard) => {
    let changes = {};
    try {
        // Fetch previous rate card

        const prevRateCard = prevCard;
        const newRateCard = newCard;
       

        // PREVIOUS WEIGHT
        let { zoneA: pzoneA, zoneB: pzoneB, zoneC: pzoneC, zoneD: pzoneD, zoneE: pzoneE, weight: pweight } = prevRateCard.weightPriceBasic[0];
        let { zoneA: pzoneA_additional, zoneB: pzoneB_additional, zoneC: pzoneC_additional, zoneD: pzoneD_additional, zoneE: pzoneE_additional, weight: pweight_additional } = prevRateCard.weightPriceAdditional[0];

        // CURRENT WEIGHT
        let { zoneA: czoneA, zoneB: czoneB, zoneC: czoneC, zoneD: czoneD, zoneE: czoneE, weight: cweight } = newRateCard.weightPriceBasic[0];
        let { zoneA: czoneA_additional, zoneB: czoneB_additional, zoneC: czoneC_additional, zoneD: czoneD_additional, zoneE: czoneE_additional, weight: cweight_additional } = newRateCard.weightPriceAdditional[0];

        console.log(pzoneA_additional,czoneA_additional);

        //COD CHARGE AND PERCENT
        let { codCharge: pcodCharge, codPercent: pcodPercent } = prevRateCard;
        let { codCharge: ccodCharge, codPercent: ccodPercent } = newRateCard;

        // Calculate percentage changes and store them in 'changes' object
        changes.zoneA = {
            forward: parseFloat(((czoneA.forward - pzoneA.forward) / pzoneA.forward * 100).toFixed(2)),
            rto: parseFloat(((czoneA.rto - pzoneA.rto) / pzoneA.rto * 100).toFixed(2))
        };

        changes.zoneB = {
            forward: parseFloat(((czoneB.forward - pzoneB.forward) / pzoneB.forward * 100).toFixed(2)),
            rto: parseFloat(((czoneB.rto - pzoneB.rto) / pzoneB.rto * 100).toFixed(2))
        };

        changes.zoneC = {
            forward: parseFloat(((czoneC.forward - pzoneC.forward) / pzoneC.forward * 100).toFixed(2)),
            rto: parseFloat(((czoneC.rto - pzoneC.rto) / pzoneC.rto * 100).toFixed(2))
        };

        changes.zoneD = {
            forward: parseFloat(((czoneD.forward - pzoneD.forward) / pzoneD.forward * 100).toFixed(2)),
            rto: parseFloat(((czoneD.rto - pzoneD.rto) / pzoneD.rto * 100).toFixed(2))
        };

        changes.zoneE = {
            forward: parseFloat(((czoneE.forward - pzoneE.forward) / pzoneE.forward * 100).toFixed(2)),
            rto: parseFloat(((czoneE.rto - pzoneE.rto) / pzoneE.rto * 100).toFixed(2))
        };

        // For weight changes
        changes.weightBasic = parseFloat(((cweight - pweight) / pweight * 100).toFixed(2));


        // Calculate percentage changes for additional weights
        changes.zoneA_additional = {
            forward: parseFloat(((czoneA_additional.forward - pzoneA_additional.forward) / pzoneA_additional.forward * 100).toFixed(2)),
            rto: parseFloat(((czoneA_additional.rto - pzoneA_additional.rto) / pzoneA_additional.rto * 100).toFixed(2))
        };

        changes.zoneB_additional = {
            forward: parseFloat(((czoneB_additional.forward - pzoneB_additional.forward) / pzoneB_additional.forward * 100).toFixed(2)),
            rto: parseFloat(((czoneB_additional.rto - pzoneB_additional.rto) / pzoneB_additional.rto * 100).toFixed(2))
        };

        changes.zoneC_additional = {
            forward: parseFloat(((czoneC_additional.forward - pzoneC_additional.forward) / pzoneC_additional.forward * 100).toFixed(2)),
            rto: parseFloat(((czoneC_additional.rto - pzoneC_additional.rto) / pzoneC_additional.rto * 100).toFixed(2))
        };

        changes.zoneD_additional = {
            forward: parseFloat(((czoneD_additional.forward - pzoneD_additional.forward) / pzoneD_additional.forward * 100).toFixed(2)),
            rto: parseFloat(((czoneD_additional.rto - pzoneD_additional.rto) / pzoneD_additional.rto * 100).toFixed(2))
        };

        changes.zoneE_additional = {
            forward: parseFloat(((czoneE_additional.forward - pzoneE_additional.forward) / pzoneE_additional.forward * 100).toFixed(2)),
            rto: parseFloat(((czoneE_additional.rto - pzoneE_additional.rto) / pzoneE_additional.rto * 100).toFixed(2))
        };

        // For weight changes in additional weights
        changes.weightAdditional = parseFloat(((cweight_additional - pweight_additional) / pweight_additional * 100).toFixed(2));

        //FOR COD
        changes.codCharge = parseFloat(((ccodCharge - pcodCharge) / pcodCharge * 100).toFixed(2));
        changes.codPercent = parseFloat(((ccodPercent - pcodPercent) / pcodPercent * 100).toFixed(2));

        // ------------------------------------changing Custom Rates Accordingly---------------------------------------------------------------
        const rateCards = await RateCard.find({});

        for (let rc of rateCards) {
            let rcard = await RateCard.findById(rc);

            if (rcard.courierServiceName.replace(/\s+/g, "").toLowerCase() === prevRateCard.courierServiceName.replace(/\s+/g, "").toLowerCase()) {


                // Apply changes for main weights
                rcard.weightPriceBasic[0].zoneA.forward += rcard.weightPriceBasic[0].zoneA.forward * (changes.zoneA.forward / 100);
                rcard.weightPriceBasic[0].zoneA.rto += rcard.weightPriceBasic[0].zoneA.rto * (changes.zoneA.rto / 100);


                rcard.weightPriceBasic[0].zoneB.forward += rcard.weightPriceBasic[0].zoneB.forward * (changes.zoneB.forward / 100);
                rcard.weightPriceBasic[0].zoneB.rto += rcard.weightPriceBasic[0].zoneB.rto * (changes.zoneB.rto / 100);

                rcard.weightPriceBasic[0].zoneC.forward += rcard.weightPriceBasic[0].zoneC.forward * (changes.zoneC.forward / 100);
                rcard.weightPriceBasic[0].zoneC.rto += rcard.weightPriceBasic[0].zoneC.rto * (changes.zoneC.rto / 100);

                rcard.weightPriceBasic[0].zoneD.forward += rcard.weightPriceBasic[0].zoneD.forward * (changes.zoneD.forward / 100);
                rcard.weightPriceBasic[0].zoneD.rto += rcard.weightPriceBasic[0].zoneD.rto * (changes.zoneD.rto / 100);

                rcard.weightPriceBasic[0].zoneE.forward += rcard.weightPriceBasic[0].zoneE.forward * (changes.zoneE.forward / 100);
                rcard.weightPriceBasic[0].zoneE.rto += rcard.weightPriceBasic[0].zoneE.rto * (changes.zoneE.rto / 100);



                // Apply changes for additional weights
                rcard.weightPriceAdditional[0].zoneA.forward += rcard.weightPriceAdditional[0].zoneA.forward * (changes.zoneA_additional.forward / 100);
                rcard.weightPriceAdditional[0].zoneA.rto += rcard.weightPriceAdditional[0].zoneA.rto * (changes.zoneA_additional.rto / 100);

                rcard.weightPriceAdditional[0].zoneB.forward += rcard.weightPriceAdditional[0].zoneB.forward * (changes.zoneB_additional.forward / 100);
                rcard.weightPriceAdditional[0].zoneB.rto += rcard.weightPriceAdditional[0].zoneB.rto * (changes.zoneB_additional.rto / 100);

                rcard.weightPriceAdditional[0].zoneC.forward += rcard.weightPriceAdditional[0].zoneC.forward * (changes.zoneC_additional.forward / 100);
                rcard.weightPriceAdditional[0].zoneC.rto += rcard.weightPriceAdditional[0].zoneC.rto * (changes.zoneC_additional.rto / 100);

                rcard.weightPriceAdditional[0].zoneD.forward += rcard.weightPriceAdditional[0].zoneD.forward * (changes.zoneD_additional.forward / 100);
                rcard.weightPriceAdditional[0].zoneD.rto += rcard.weightPriceAdditional[0].zoneD.rto * (changes.zoneD_additional.rto / 100);

                rcard.weightPriceAdditional[0].zoneE.forward += rcard.weightPriceAdditional[0].zoneE.forward * (changes.zoneE_additional.forward / 100);
                rcard.weightPriceAdditional[0].zoneE.rto += rcard.weightPriceAdditional[0].zoneE.rto * (changes.zoneE_additional.rto / 100);


                //Apply Changes to cod charge
                rcard.codCharge += rcard.codCharge * (changes.codCharge / 100);
                //Apply chnages to cod Percent
                rcard.codPercent += rcard.codPercent * (changes.codPercent / 100);


                // Save the updated rate card
                await rcard.save();
            }

        }

    } catch (error) {
        console.log("Error updating rate card:", error);
        return res.status(500).json({ error: "Failed to update rate card" });
    }
};

module.exports = { editBaseRate };

