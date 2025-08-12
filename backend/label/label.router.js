const router = require('express').Router();
const {getLabelSettings,saveLabelSettings,uploadLabelLogo}=require("./labelCustomize.controller")
const {isAuthorized}=require("../middleware/auth.middleware")
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });


router.post("/uploadLogo", isAuthorized, upload.single("logo"), uploadLabelLogo);
router.get("/getLabel", isAuthorized, getLabelSettings);
router.post("/saveLabel", isAuthorized, saveLabelSettings);



module.exports = router;