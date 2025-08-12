const mongoose = require('mongoose');
// const RateCard = require('./rateCards'); // Assuming RateCard model is here

// Define the Plan schema
const planSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  planName: {
    type: String,
    required: true,
  },
  // rateCard: {  // Make rateCard optional
  //   type: mongoose.Schema.Types.Mixed,  // Allow it to store any object type
  //   required: false,  // Optional
  // },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
});


const Plan = mongoose.model('Plan', planSchema);
module.exports = Plan;
