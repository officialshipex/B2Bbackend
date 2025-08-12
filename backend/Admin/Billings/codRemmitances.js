const User = require("../../models/User.model");
const CodRemittance = require("../../COD/codRemittance.model");
const AllocateRole = require("../../models/allocateRoleSchema");
const mongoose = require("mongoose");

const getAllCodRemittance = async (req, res) => {
  try {
    const {
      userSearch,
      fromDate,
      toDate,
      status,
      page = 1,
      limit = 20,
      remittanceId,
      utr,
    } = req.query;

    const userMatchStage = {};
    const remittanceMatchStage = {};

    // --- Employee filtering logic ---
    let allocatedUserIds = null;
    if (req.employee && req.employee.employeeId) {
      const allocations = await AllocateRole.find({
        employeeId: req.employee.employeeId,
      });
      allocatedUserIds = allocations.map((a) => a.sellerMongoId.toString());
      if (allocatedUserIds.length === 0) {
        return res.json({
          total: 0,
          page: Number(page),
          limit: limit === "all" ? "all" : Number(limit),
          results: [],
          summary: {
            totalCodRemitted: 0,
            totalDeductions: 0,
            totalRemittanceInitiated: 0,
            CODToBeRemitted: null,
          },
        });
      }
      userMatchStage["user._id"] = { $in: allocatedUserIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    if (userSearch) {
      const regex = new RegExp(userSearch, "i");
      if (mongoose.Types.ObjectId.isValid(userSearch)) {
        userMatchStage["$or"] = [
          { "user._id": new mongoose.Types.ObjectId(userSearch) },
          { "user.email": regex },
          { "user.fullname": regex },
        ];
      } else {
        userMatchStage["$or"] = [
          { "user.email": regex },
          { "user.fullname": regex },
        ];
      }
    }

    if (fromDate && toDate) {
      const startDate = new Date(new Date(fromDate).setHours(0, 0, 0, 0));
      const endDate = new Date(new Date(toDate).setHours(23, 59, 59, 999));
      remittanceMatchStage["remittanceData.date"] = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    if (status) {
      remittanceMatchStage["remittanceData.status"] = status;
    }

    if (remittanceId) {
      remittanceMatchStage["remittanceData.remittanceId"] = remittanceId;
    }

    if (utr) {
      remittanceMatchStage["remittanceData.utr"] = utr;
    }

    const parsedLimit = limit === "all" ? 0 : Number(limit);
    const skip = (Number(page) - 1) * parsedLimit;

    const basePipeline = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $match: userMatchStage },
      { $unwind: "$remittanceData" },
      { $match: remittanceMatchStage },
    ];

    const dataPipeline = [
      ...basePipeline,
      {
        $project: {
          _id: 0,
          user: {
            userId: "$user.userId",
            name: "$user.fullname",
            email: "$user.email",
            phoneNumber: "$user.phoneNumber",
          },
          remittanceId: "$remittanceData.remittanceId",
          date: "$remittanceData.date",
          status: "$remittanceData.status",
          remittanceMethod: "$remittanceData.remittanceMethod",
          utr: "$remittanceData.utr",
          codAvailable: "$remittanceData.codAvailable",
          amountCreditedToWallet: "$remittanceData.amountCreditedToWallet",
          earlyCodCharges: "$remittanceData.earlyCodCharges",
          adjustedAmount: "$remittanceData.adjustedAmount",
          TotalCODRemitted: "$TotalCODRemitted",
          TotalDeductionfromCOD: "$TotalDeductionfromCOD",
        },
      },
      { $sort: { date: -1 } },
    ];

    const summaryPipeline = [
      ...basePipeline,
      {
        $group: {
          _id: null,
          totalCodRemitted: { $sum: "$TotalCODRemitted" },
          totalDeductions: { $sum: "$TotalDeductionfromCOD" },
          totalRemittanceInitiated: { $sum: "$RemittanceInitiated" },
          CODToBeRemitted: { $max: "$CODToBeRemitted" },
        },
      },
    ];

    const [results, totalResult, summaryData] = await Promise.all([
      parsedLimit === 0
        ? CodRemittance.aggregate(dataPipeline)
        : CodRemittance.aggregate([
            ...dataPipeline,
            { $skip: skip },
            { $limit: parsedLimit },
          ]),

      CodRemittance.aggregate([...dataPipeline, { $count: "total" }]),

      CodRemittance.aggregate(summaryPipeline),
    ]);

    const total = totalResult[0]?.total || 0;
    const summary = summaryData[0] || {};

    return res.json({
      total,
      page: Number(page),
      limit: parsedLimit === 0 ? "all" : parsedLimit,
      results,
      summary: {
        totalCodRemitted: summary.totalCodRemitted || 0,
        totalDeductions: summary.totalDeductions || 0,
        totalRemittanceInitiated: summary.totalRemittanceInitiated || 0,
        CODToBeRemitted: summary.CODToBeRemitted || null,
      },
    });
  } catch (error) {
    console.error("Error in getAllCodRemittance:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAllCodRemittance };