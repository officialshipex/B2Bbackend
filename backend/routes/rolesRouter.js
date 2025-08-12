const express = require("express");
const router = express.Router();
const {login, createRole, getAllRoles, getRoleById, updateRole, deleteRole, getSalesExecutives, allocateRole, getAllAllocations, deleteAllocation, getMyAllocations} = require("../staffRoles/rolesController");
const { isAuthorized } = require("../middleware/auth.middleware");



router.get("/verify", isAuthorized, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Token verified successfully",
    user: req.user || null,
    employee: req.employee || null,
  });
});
  

// Public routes
router.post("/createRole", createRole);
router.post("/e-login", login);
router.get("/sales-executives", isAuthorized, getSalesExecutives);
router.post("/allocate", isAuthorized, allocateRole);
router.get("/allAllocations", isAuthorized, getAllAllocations);
router.delete("/deleteAllocation/:id", isAuthorized, deleteAllocation);
// Protected routes (require token verification)
router.get("/", isAuthorized, getAllRoles);
router.get("/myAllocations", isAuthorized, getMyAllocations);
router.get("/:id", isAuthorized, getRoleById);
router.put("/updateRole/:id", isAuthorized, updateRole);
router.delete("/deleteRole/:id", isAuthorized,deleteRole);


module.exports = router;