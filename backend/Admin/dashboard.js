const Order = require("../models/newOrder.model");

const getDashboardStats = async (req, res) => {
  try {
    const couriers = ["Delhivery", "EcomExpress", "DTDC","Amazon"];

    const [totalOrders, courierStats] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        {
          $group: {
            _id: { provider: "$provider", status: "$status" }, // ✅ Fixed this line
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = {
      totalOrders,
      courierData: {
        Delhivery: [],
        EcomExpress: [],
        DTDC: [],
        Amazon:[]
      },
    };

    courierStats.forEach(({ _id, count }) => {
      const { provider, status } = _id;
      if (stats.courierData[provider]) {
        stats.courierData[provider].push({ status, count });
      }
    });
// console.log(stats)
    res.status(200).json(stats);
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res
      .status(500)
      .json({ error: "Server error while fetching dashboard stats" });
  }
};

module.exports = { getDashboardStats };
