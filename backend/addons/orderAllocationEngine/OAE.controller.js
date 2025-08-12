const ShippingRules = require("./OAE.model");
const validateShippingRule = require('../utils/shippingRulesValidation');


const createShippingRule = async (req, res) => {
    try {
        // console.log(req.body);
        const user = req.user._id;

        const { error } = validateShippingRule.validate(req.body);

        if (error) {
            console.log(error);
            return res.status(400).json({
                status: false,
                message: 'Validation error',
                error: error.details[0].message,
            });
        }

        const existsRule = await ShippingRules.findOne({ setPriority: req.body.setPriority });
        if (existsRule) {
            return res.status(409).json({
                status: false,
                message: 'A shipping rule with the same set priority already exists',
            });
        }

        const {
            status,
            ruleType,
            ruleName,
            setPriority,
            conditionType,
            conditions,
            courierPriority,
        } = req.body;

        const newRule = new ShippingRules({
            user,
            status,
            ruleType,
            ruleName,
            setPriority,
            conditionType,
            conditions,
            courierPriority,
        });

        const savedRule = await newRule.save();

        res.status(201).json({
            status: true,
            message: 'Shipping rule created successfully'
        });
    } catch (error) {
        // console.error(error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            const value = error.keyValue[field];
            return res.status(409).json({
                status: false,
                message: `Duplicate value error: ${field} already exists with value '${value}'.`,
            });
        }

        res.status(500).json({
            status: false,
            message: 'Error creating shipping rule'
        });
    }
};

const updateShippingRule = async (req, res) => {
    try {

        const { error } = validateShippingRule.validate(req.body);

        if (error) {
            return res.status(400).json({
                status: false,
                message: 'Validation error',
                error: error.details[0].message,
            });
        }

        const { id } = req.params;
        const updates = req.body;

        const updatedRule = await ShippingRules.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!updatedRule) {
            return res.status(404).json({
                status: false,
                message: 'Shipping rule not found',
            });
        }

        res.status(200).json({
            status: true,
            message: 'Shipping rule updated successfully',
            rule: updatedRule,
        });
    } catch (error) {

        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            const value = error.keyValue[field];
            return res.status(409).json({
                status: false,
                message: `Duplicate value error: ${field} already exists with value '${value}'.`,
            });
        }

        res.status(500).json({
            status: false,
            message: 'Error updating shipping rule',
            error: error.message,
        });
    }
};

const changeRuleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedRule = await ShippingRules.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!updatedRule) {
            return res.status(404).json({
                status: false,
                message: 'Shipping rule not found',
            });
        }

        res.status(200).json({
            status: true,
            message: 'Shipping rule status updated successfully',
            rule: updatedRule,
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Error updating shipping rule status',
            error: error.message,
        });
    }
};

const getAllRules = async (req, res) => {
    try {

        const user = req.user._id;

        const rules = await ShippingRules.find({ user });
        if (!rules) {
            return res.status(404).json({
                status: false,
                message: 'No shipping rules found',
            });
        }

        res.status(200).json({
            status: true,
            message: 'Shipping rules fetched successfully',
            data: rules,
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: 'Error fetching shipping rules',
            error: error.message,
        });
    }
};

module.exports = {
    createShippingRule,
    updateShippingRule,
    changeRuleStatus,
    getAllRules,
};