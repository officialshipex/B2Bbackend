const express = require('express');
const router = express.Router();
const {
  getAllUsersForPlan,
  getAllAssignedPlans,
  assignPlanToUser
} = require('../staffRoles/assignPlan.js');

// GET: fetch users for dropdown
router.get('/get-users', getAllUsersForPlan);

// GET: fetch all assigned plans
router.get('/assigned-plans', getAllAssignedPlans);

// POST: assign a plan to a user
router.post('/assign-plan', assignPlanToUser);

module.exports = router;
