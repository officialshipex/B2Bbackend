const RateCard = require("../models/rateCards");
const CourierServiceSecond = require("../models/courierServiceSecond.model");
const Plan = require("../models/Plan.model");
const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

const saveRate = async (req, res) => {
  try {
    const {
      plan,
      courierProviderName,
      mode,
      courierServiceName,
      weightPriceBasic,
      weightPriceAdditional,
      codPercent,
      codCharge,
      status,
      shipmentType,
    } = req.body;

    console.log(weightPriceBasic);
    console.log(weightPriceAdditional);

    // Fetch users with assigned plans (filtered by planName)
    const usersWithPlans = await Plan.find({ planName: plan });

    if (!usersWithPlans || usersWithPlans.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found with assigned plans",
      });
    }

    console.log(usersWithPlans);

    // Function to check required fields
    const checkRequiredFields = (weightData) => {
      return weightData.every(weight => {
        return weight.zoneA !== undefined &&
               weight.zoneB !== undefined &&
               weight.zoneC !== undefined &&
               weight.zoneD !== undefined &&
               weight.zoneE !== undefined;
      });
    };

    if (!checkRequiredFields(weightPriceBasic) || !checkRequiredFields(weightPriceAdditional)) {
      return res.status(400).json({ message: "Missing required fields for zone rates (e.g. zoneA, zoneB, etc.)." });
    }

    // Check if the rate card already exists
    let existingRateCard = await RateCard.findOne({
      plan,
      mode,
      courierProviderName,
      courierServiceName,
    });

    let savedRateCard;

    if (existingRateCard) {
      // Update existing rate card
      existingRateCard.weightPriceBasic = weightPriceBasic;
      existingRateCard.weightPriceAdditional = weightPriceAdditional;
      existingRateCard.codPercent = codPercent;
      existingRateCard.codCharge = codCharge;
      existingRateCard.mode = mode;

      savedRateCard = await existingRateCard.save();

      res.status(201).json({
        message: `${plan} rate card has been updated successfully for service ${courierServiceName} under provider ${courierProviderName}`,
      });
    } else {
      // Create new rate card
      const rcard = new RateCard({
        plan,
        mode,
        courierProviderName,
        courierServiceName,
        weightPriceBasic,
        weightPriceAdditional,
        codPercent,
        codCharge,
        status,
        shipmentType,
        defaultRate: true,
      });

      savedRateCard = await rcard.save();

      // Update courier service with new rate card
      await CourierServiceSecond.updateOne(
        { courierProviderServiceName: courierServiceName },
        { $push: { rateCards: savedRateCard } }
      );

      res.status(201).json({
        message: `${plan} rate card has been added successfully for service ${courierServiceName} under provider ${courierProviderName}`,
      });
    }

    // **Update all users' rateCard field who have the same plan**
    await Plan.updateMany(
      { planName: plan },
      { $push: { rateCard: savedRateCard } }
    );

    console.log(`Updated users with plan "${plan}" to include new rate card`);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving or updating Rate Card" });
  }
};



const getRateCard = async (req, res) => {
  try {
    const allRateCard = await RateCard.find();  // Fetch all rate cards
    res.status(200).json({ 
      message: "Rate cards retrieved successfully", 
      rateCards: allRateCard  // Return the rate card data in the response body
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error retrieving rate cards" });  // Handle errors
  }
};


const getUsersWithPlans = async (req, res) => {
  try {
    // Fetch all plans with user details
    const usersWithPlans = await Plan.find({});

    if (!usersWithPlans || usersWithPlans.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found with assigned plans",
      });
    }
    console.log(usersWithPlans)

    res.status(200).json({
      success: true,
      data: usersWithPlans,
    });
  } catch (error) {
    console.error("Error fetching users with plans:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users with assigned plans",
      error: error.message,
    });
  }
};


// Update Rate Card
const updateRateCard = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Update the main RateCard document
    const updatedRateCard = await RateCard.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedRateCard) {
      return res.status(404).json({ message: "Rate Card not found" });
    }

    // Step 2: Find all plans with the given plan name
    const plans = await Plan.find({ planName: req.body.plan });

    // Step 3: Loop over plans and update matching rateCard object
    for (const plan of plans) {
      let modified = false;

      plan.rateCard = plan.rateCard.map((rc) => {
        if (rc._id.toString() === id) {
          modified = true;
          return {
            ...rc._doc, // existing structure
            ...updatedRateCard.toObject(), // overwrite with new data
          };
        }
        return rc;
      });

      if (modified) {
        await plan.save();
      }
    }

    res.status(200).json({ message: "Rate Card updated in matching plans." });
  } catch (error) {
    console.error("Error updating rate card in plans:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};






const getRateCardById = async (req, res) => {
  try {
    const { id } = req.params; // Get the ID from the URL
    const rateCard = await RateCard.findById(id); // Fetch the rate card by ID

    if (!rateCard) {
      return res.status(404).json({ message: "Rate Card not found" }); // Return 404 if not found
    }

    res.status(200).json({ message: "Rate card retrieved successfully", rateCard }); // Return the found rate card
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error retrieving rate card" }); // Handle any server errors
  }
};





const getPlan = async (req, res) => {
  try {
    const allPlan = await Plan.findOne({ userId: req.user._id });

    if (!allPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found for the user.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Plan retrieved successfully.",
      data: allPlan.rateCard, // Sending only rateCard, modify if needed
    });
  } catch (error) {
    console.error("Error fetching plan:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
      error: error.message, // Optional, useful for debugging
    });
  }
};






const uploadRate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const filePath = path.join(__dirname, "../uploads", req.file.filename);

    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      let parsedData;
      try {
        parsedData = JSON.parse(req.body.data);
      } catch (error) {
        return res.status(400).send("Invalid JSON data.");
      }

      const { courierProviderName, plan } = parsedData;
      let service = "";
      let mode = "Surface";

      const existingCourier = await CourierServiceSecond.find({
        provider: courierProviderName,
      }).populate("services");
      const existingServices = existingCourier.flatMap((courier) =>
        courier.services.map((service) =>
          service.courierProviderServiceName.replace(/\s+/g, "").toLowerCase()
        )
      );

      for (const item of data) {
        if (item.Courier) {
          service = item.Courier;
          mode = item.mode || mode;

          const lowercaseCurrService = service.replace(/\s+/g, "").toLowerCase();

          if (existingServices.includes(lowercaseCurrService)) {
            const existingRateCard = await RateCard.findOne({
              plan,
              mode,
              courierProviderName,
              courierServiceName: service,
            });

            const transformedData = [
              {
                weight: parseFloat(item.Weight),
                zoneA: { forward: item["Zone A Forward"] },
                zoneB: { forward: item["Zone B Forward"] },
                zoneC: { forward: item["Zone C Forward"] },
                zoneD: { forward: item["Zone D Forward"] },
                zoneE: { forward: item["Zone E Forward"] },
              },
            ];

            if (existingRateCard) {
              existingRateCard.weightPriceBasic = transformedData;
              existingRateCard.codPercent = item["COD %"];
              existingRateCard.codCharge = item["COD Charge"];
              existingRateCard.mode = mode;
            } else {
              const rcard = new RateCard({
                plan,
                mode,
                courierProviderName,
                courierServiceName: service,
                weightPriceBasic: transformedData,
                codPercent: item["COD %"],
                codCharge: item["COD Charge"],
                defaultRate: true,
              });

              const existingPlan = await Plan.findOne({ plan });
              if (!existingPlan) {
                const newPlan = new Plan({ plan });
                await newPlan.save();
              }

              const savedRateCard = await rcard.save();

              await CourierServiceSecond.updateOne(
                { courierProviderServiceName: service },
                { $push: { rateCards: savedRateCard } }
              );
            }

            continue;
          }
        } else {
          const transformedData = [
            {
              weight: parseFloat(item.Weight.replace(/[^\d.-]/g, "")),
              zoneA: { forward: item["Zone A Forward"] },
              zoneB: { forward: item["Zone B Forward"] },
              zoneC: { forward: item["Zone C Forward"] },
              zoneD: { forward: item["Zone D Forward"] },
              zoneE: { forward: item["Zone E Forward"] },
            },
          ];

          const existingRateCard = await RateCard.findOne({
            plan,
            mode,
            courierProviderName,
            courierServiceName: service,
          });

          if (existingRateCard) {
            existingRateCard.weightPriceAdditional = transformedData;
            await existingRateCard.save();
          }
        }
      }

      fs.unlinkSync(filePath);

      res.status(201).json("File uploaded and data saved successfully.");
    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).json("Error processing file.");
    }
  } catch (error) {
    console.error("General error:", error);
    res.status(500).json("An unexpected error occurred.");
  }
};

module.exports = { saveRate, uploadRate, getRateCard,getPlan, updateRateCard, getRateCardById, getUsersWithPlans };
