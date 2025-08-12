const Joi = require('joi');

const shippingRuleSchema = Joi.object({

    ruleType: Joi.string().valid('B2C order', 'B2B order', 'Document order').required().messages({
        'string.base': 'Rule type must be a string',
        'any.required': 'Rule type is required',
        'any.only': 'Rule type must be one of B2C order, B2B order, or Document order',
    }),

    ruleName: Joi.string().required().messages({
        'string.base': 'Rule name must be a string',
        'any.required': 'Rule name is required',
    }),

    setPriority: Joi.number().required().messages({
        'number.base': 'Set priority must be a number',
        'any.required': 'Set priority is required',
    }),

    conditionType: Joi.string().valid('Match Any of the Below', 'Match All of the Below').required().messages({
        'string.base': 'Condition type must be a string',
        'any.required': 'Condition type is required',
        'any.only': 'Condition type must be one of Match Any of the Below, Match All of the Below',
    }),

}).unknown(true);

module.exports = shippingRuleSchema;
