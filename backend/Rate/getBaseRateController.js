const BaseRateCard = require("../models/baseRateCard.model");
const Plan=require("../models/Plan.model");
const RateCard=require("../models/rateCards");

const getBaseRates = async (req, res) => {
    try {
        let result = await BaseRateCard.find({});
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: "Error fetching base rates", error });
    }
};


const getPlans=async(req,res)=>{
    try {
        let result = await Plan.find({});
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: "Error fetching plans", error });
    }
}

const getCouriers=async(req,res)=>{
    try {
        const plan=req.body.type;
        let result = await RateCard.find({type:plan});
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: "Error fetching couriers", error });
    }
}


module.exports={getBaseRates,getPlans,getCouriers};

