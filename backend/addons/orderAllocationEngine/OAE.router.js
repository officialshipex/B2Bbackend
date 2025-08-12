const express = require('express');
const router = express.Router();

const { updateShippingRule, changeRuleStatus, getAllRules } = require('./OAE.controller'); // Adjust the path as needed
const { createShippingRule } = require('./OAE.controller');

router.post('/shipping-rule', createShippingRule)

router.put('/shipping-rule/:id', updateShippingRule);

router.patch('/shipping-rule/:id/status', changeRuleStatus);

router.get('/shipping-rule', getAllRules);

module.exports = router;
