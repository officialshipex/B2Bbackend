// controllers/roleController.js
const Role = require("../models/roles.modal");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AllocateRole = require("../models/allocateRoleSchema");
const User = require("../models/User.model");

function generateEmployeeId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const createRole = async (req, res) => {
  try {
    const {
      fullName,
      email,
      contactNumber,
      password,
      isActive,
      role,
      accessRights,
      isAdmin = true, // Default to true if not provided
      adminTab = true, // Default to true if not provided
    } = req.body;

    const existingUser = await Role.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email ID already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let employeeId;
    let isUnique = false;
    while (!isUnique) {
      employeeId = generateEmployeeId();
      const exists = await Role.findOne({ employeeId });
      if (!exists) isUnique = true;
    }

    const newRole = new Role({
      fullName,
      email,
      contactNumber,
      password: hashedPassword,
      isActive,
      isAdmin,
      adminTab,
      role,
      accessRights,
      employeeId, // <-- Assign here
    });

    await newRole.save();

    return res.status(201).json({
      success: true,
      message: "Employee registered successfully",
      data: {
        user: {
          id: newRole._id,
          email: newRole.email,
          fullName: newRole.fullName,
          role: newRole.role,
          isAdmin: newRole.isAdmin,
          adminTab: newRole.adminTab,
          employeeId: newRole.employeeId, // <-- Return here
        },
      },
    });
  } catch (error) {
    console.error("Create Role Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    return res.status(200).json(roles);
  } catch (error) {
    console.error("Get Roles Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });
    return res.status(200).json(role);
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updatedRole = await Role.findByIdAndUpdate(id, updates, {
      new: true,
    });
    return res.status(200).json({ message: "Role updated", updatedRole });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

const deleteRole = async (req, res) => {
  try {
    await Role.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email,password)

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    const employee = await Role.findOne({ email });
    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Employee does not exist",
      });
    }

    const checkPassword = await bcrypt.compare(password, employee.password);
    // console.log(checkPassword)
    if (!checkPassword) {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    const token = jwt.sign(
      {
        employee: {
          id: employee._id,
          employeeId: employee.employeeId,
          email: employee.email,
          fullName: employee.fullName,
          isAdmin: employee.isAdmin,
          adminTab: employee.adminTab,
          isEmployee: true,
        },
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      success: true,
      message: "Employee logged in successfully",
      data: token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getSalesExecutives = async (req, res) => {
  try {
    const executives = await Role.find({
      role: {
        $in: ["Sales Manager", "Sales Executive", "Key Account Manager"],
      },
      isEmpActive: true,
    }).select("_id fullName email role employeeId");
    // console.log(executives);
    return res.status(200).json({ success: true, executives });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

const allocateRole = async (req, res) => {
  try {
    const { sellerId, sellerName, employeeId, employeeName } = req.body;
    if (!sellerId || !sellerName || !employeeId || !employeeName) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    // Find the seller's MongoDB _id
    const seller = await User.findOne({ userId: sellerId });
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }
    const allocation = new AllocateRole({
      sellerId,
      sellerMongoId: seller._id,
      sellerName,
      employeeId,
      employeeName,
    });
    await allocation.save();
    return res.status(201).json({
      success: true,
      message: "Role allocated successfully",
      allocation,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// Get all allocations
const getAllAllocations = async (req, res) => {
  try {
    const allocations = await AllocateRole.find().sort({ allocatedAt: -1 });
    return res.status(200).json({ success: true, allocations });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};
const deleteAllocation = async (req, res) => {
  try {
    await AllocateRole.findByIdAndDelete(req.params.id);
    return res
      .status(200)
      .json({ success: true, message: "Allocation deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getMyAllocations = async (req, res) => {
  // console.log("getMyAllocations called");
  try {
    // console.log("req.employee:", req.employee);
    if (!req.employee || !req.employee.employeeId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const employeeId = req.employee.employeeId;
    const allocations = await AllocateRole.find({ employeeId }).sort({ allocatedAt: -1 });
    return res.status(200).json({ success: true, allocations });
  } catch (error) {
    console.error("getMyAllocations error:", error);
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};



module.exports = {
  getMyAllocations,
  login,
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getSalesExecutives,
  allocateRole,
  getAllAllocations,
  deleteAllocation,
};
