const express = require('express');
const router = express.Router();

// Correctly import both functions from the same module
const { getAllCouriers, deleteCourier } = require('../AllCouriers/getActiveCourier');

router.get('/couriers', getAllCouriers);
router.delete('/deleteCourier/:id', deleteCourier);

module.exports = router;
