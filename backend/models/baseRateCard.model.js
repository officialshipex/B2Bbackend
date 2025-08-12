const mongoose = require("mongoose");

const weightSchema = new mongoose.Schema({
  weight: {
    type: Number,
    required: true,
  },
  zoneA: {
    forward: {
      type: Number,
      required: true,
      default: 0 // Set default to avoid undefined values
    },
    rto: {
      type: Number,
      required: false,
    }
  },
  zoneB: {
    forward: {
      type: Number,
      required: true,
      default: 0
    },
    rto: {
      type: Number,
      required: false,
    }
  },
  zoneC: {
    forward: {
      type: Number,
      required: true,
      default: 0
    },
    rto: {
      type: Number,
      required: false,
    }
  },
  zoneD: {
    forward: {
      type: Number,
      required: true,
      default: 0
    },
    rto: {
      type: Number,
      required: false,
    }
  },
  zoneE: {
    forward: {
      type: Number,
      required: true,
      default: 0
    },
    rto: {
      type: Number,
      required: false,
    }
  },
});

const baseRateCardSchema = new mongoose.Schema({
  plan: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    required: false
  },
  courierProviderName: {
    type: String,
    required: true,
  },
  courierServiceName: {
    type: String,
    required: true,
  },
  courierProviderId: {
    type: String,
  },
  courierServiceId: {
    type: String,
  },
  weightPriceBasic: [weightSchema],
  weightPriceAdditional: [weightSchema],
  codPercent: {
    type: Number,
    required: true,
  },
  codCharge: {
    type: Number,
    required: true,
  },
  gst: {
    type: Number,
  },
  defaultRate: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    required: true
  },
  shipmentType: {
    type: String,
    enum: ["Forward", "Reverse"],
    required: true
  }
});

// Create the model from the schema
const BaseRateCard = mongoose.model('BaseRateCard', baseRateCardSchema);

module.exports = BaseRateCard;