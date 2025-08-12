const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const saveBaseRateController=require("../Rate/saveBaseRateController");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /xlsx|xls/;
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimeType =
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype === "application/octet-stream";

    if (extname && mimeType) {
      cb(null, true); 
    } else {
      cb(new Error("Only Excel files are allowed!"));
    }
  },
});

router.post("/",saveBaseRateController.saveBaseRate);


router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {

      return res.status(400).json({ error: `Multer Error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    saveBaseRateController.uploadBaseRate(req, res, next);
  });
});






module.exports=router;