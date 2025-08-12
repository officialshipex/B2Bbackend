const mongoose = require("mongoose");

const codPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    // required: true,
  },
  planName: {
    type: String,
    enum: ["D+1", "D+2", "D+3","D+4", "D+7"], // Allowed values
    default: "D+7", // Default plan
    required: true,
  },
  planCharges: { 
    type: Number,
   
  },
});

// Pre-save hook to set planCharges based on planName
codPlanSchema.pre("save", function (next) {
  const planChargesMap = {
    "D+1": 1.5,
    "D+2": 0.99,
    "D+3": 0.70,
    "D+4": 0.50,
    "D+7":0
  };

  this.planCharges = planChargesMap[this.planName] || 0; // Default to D+7 charge if missing
  next();
});

const CodPlan = mongoose.models.CodPlan || mongoose.model("CodPlan", codPlanSchema);

module.exports = CodPlan;
