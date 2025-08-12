const express = require('express');
const { ndrProcessController } = require('../NDR/ndrProcess');

const router = express.Router();


router.post('/ndr-process', ndrProcessController);

module.exports = router;
