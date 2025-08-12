const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema({
  view: { type: Boolean, default: false },
  update: { type: Boolean, default: false },
  action: { type: Boolean, default: false },
});


const accessSectionSchema = new mongoose.Schema({}, { strict: false });


const roleSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contactNumber: { type: String, required: true },
  password: { type: String, required: true },
  employeeId: { type: String, unique: true, required: true },
  isEmpActive: { type: Boolean, default: true },
  isAdmin: { type: Boolean, default: true },
  adminTab:{ type: Boolean, default: true },
  role: { type: String, required: true },
  accessRights: {
    ndr: { type: accessSectionSchema, default: {} },
    tools: { type: accessSectionSchema, default: {} },
    wallet: { type: accessSectionSchema, default: {} },
    finance: { type: accessSectionSchema, default: {} },
    setupAndManage: { type: accessSectionSchema, default: {} },
    courier: { type: accessSectionSchema, default: {} },
    orders: { type: accessSectionSchema, default: {} },
    support: { type: accessSectionSchema, default: {} },
  },
}, { timestamps: true }); // optional: add timestamps


// Create and export model
const Role = mongoose.model("Role", roleSchema);
module.exports = Role;
