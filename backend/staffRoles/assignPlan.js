const User = require('../models/User.model');
const Plan = require('../models/Plan.model');



const getAllUsersForPlan = async (req, res) => {
  try {
    // Fetch _id, fullname, and userId
    const users = await User.find({}, { fullname: 1, userId: 1 }) // projection to include userId
      .sort({ fullname: 1 });

    const formatted = users.map(u => ({
      id: u._id,            
      userId: u.userId,     
      name: u.fullname  
    }));

    return res.status(200).json({
      success: true,
      users: formatted
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};


// 2. Fetch all assigned plans
const getAllAssignedPlans = async (req, res) => {
  try {
    const plans = await Plan.find({})
      .sort({ assignedAt: -1 });

    const formatted = plans.map((p, idx) => ({
      slNo: idx + 1,
      userName: p.userName,
      planName: p.planName,
      assignedAt: p.assignedAt
    }));

    return res.status(200).json({
      success: true,
      plans: formatted
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ success: false, message: 'Failed to fetch assigned plans' });
  }
};

// 3. Assign a plan to a user
const assignPlanToUser = async (req, res) => {
  try {
    const { userId, planName } = req.body;

    if (!userId || !planName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, planName'
      });
    }

    // Find the user by numeric/string userId
    const user = await User.findOne({ userId: userId }, { fullname: 1, userId: 1 });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Upsert (update if exists, insert if not)
    const updatedPlan = await Plan.findOneAndUpdate(
      { userId: user.userId }, // find by userId
      {
        userId: user.userId,
        userName: user.fullname,
        planName,
        assignedAt: new Date() // update assignment date
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Plan assigned successfully',
      plan: updatedPlan
    });
  } catch (error) {
    console.error('Error assigning plan:', error);
    res.status(500).json({ success: false, message: 'Failed to assign plan' });
  }
};



module.exports = {
  getAllUsersForPlan,
  getAllAssignedPlans,
  assignPlanToUser
};