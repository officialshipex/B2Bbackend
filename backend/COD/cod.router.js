const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const {
  codPlanUpdate,
  codRemittanceData,
  getCodRemitance,
  codRemittanceRecharge,
  getAdminCodRemitanceData,
  downloadSampleExcel,
  uploadCodRemittance,
  CheckCodplan,
  remittanceTransactionData,
  courierCodRemittance,
  CodRemittanceOrder,
  sellerremittanceTransactionData,
  CourierdownloadSampleExcel,
  uploadCourierCodRemittance,
  exportOrderInRemittance
} = require("./cod.controller");
const { isAuthorized } = require("../middleware/auth.middleware");
router.post("/codPlanUpdate", codPlanUpdate);
router.get("/codRemittanceData", codRemittanceData);
router.get("/getCodRemitance", getCodRemitance);
router.post("/codRemittanceRecharge", codRemittanceRecharge);
router.get("/getAdminCodRemitanceData",getAdminCodRemitanceData)
router.get("/download-excel",downloadSampleExcel)
router.get("/download-excel-courier",CourierdownloadSampleExcel)
router.post('/upload', upload.single('file'), uploadCodRemittance);
router.post('/upload_courier', upload.single('file'), uploadCourierCodRemittance);
router.get("/CheckCodplan",CheckCodplan)
router.get("/remittanceTransactionData/:id",remittanceTransactionData)
router.get("/sellerremittanceTransactionData/:id",sellerremittanceTransactionData)
router.get("/courierCodRemittance",courierCodRemittance)
router.get("/CodRemittanceOrder",CodRemittanceOrder)
router.get("/exportOrderInRemittance",exportOrderInRemittance)

module.exports = router;