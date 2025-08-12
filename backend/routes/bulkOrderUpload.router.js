const express = require('express');
const multer = require('multer');
const { bulkOrder,downloadSampleExcel } = require('../Orders/bulkOrdersUpload.controller');

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), bulkOrder);
router.get("/download-excel", downloadSampleExcel);
module.exports = router;
