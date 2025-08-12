const ShippingRules = require("../addons/orderAllocationEngine/OAE.model");

const AutoShip = async (order, wh, userId) => {
    console.log(order);

    const rules = await ShippingRules.find({ ruleType: "B2C order", status: true, user: userId });
    console.log("888888",rules);
    const sortedRules = rules.sort((a, b) => a.setPriority - b.setPriority);

    const services = [];

    for (const rule of sortedRules) {
        const { conditionType, conditions } = rule;

        if (conditionType === "Match Any of the Below") {
            if (conditions.some((condition) => evaluateCondition(order, wh, condition.type, condition.operator, condition.value))) {
                services.push(rule.courierPriority);
            }
        } else if (conditionType === "Match All of the Below") {
            if (conditions.every((condition) => evaluateCondition(order, wh, condition.type, condition.operator, condition.value))) {
                services.push(rule.courierPriority);
            }
        }
    }

    console.log("Priority Services are", services);
    return services;
};


const evaluateCondition = (order, wh, type, operator, value) => {
    let orderValue;

    switch (type) {
        case "paymentMode":
            orderValue = order.order_type === "Cash On Delivery" ? "COD" : "Prepaid";
            break;
        case "pickupPincode":
            orderValue = wh.pinCode;
            break;
        case "deliveryPincode":
            orderValue = order.shipping_details?.pinCode || "";
            break;
        case "orderAmount":
            orderValue = parseFloat(order.subTotal) || 0;
            break;
        case "zone":
            orderValue = order.delivery?.zone || "";
            break;
        case "productName":
            orderValue = order.Product_details.map((prod) => prod.product);
            break;
        case "productSKU":
            orderValue = order.Product_details.map((prod) => prod.sku);
            break;
        case "tags":
            orderValue = order.tags || [];
            break;
        default:
            orderValue = order[type] || null;
    }

    return evaluateOperator(orderValue, operator, value);
};


const evaluateOperator = (orderValue, operator, value) => {
    switch (operator) {
        case "is":
            return Array.isArray(orderValue) ? orderValue.includes(value) : orderValue === value;
        case "is Not":
            return Array.isArray(orderValue) ? !orderValue.includes(value) : orderValue !== value;
        case "greater Than Or Equal":
            return orderValue >= value;
        case "less Than Or Equal":
            return orderValue <= value;
        case "any Of":
            return Array.isArray(value) && value.some((v) => (Array.isArray(orderValue) ? orderValue.includes(v) : orderValue === v));
        case "starts With":
            return Array.isArray(orderValue)
                ? orderValue.some((v) => typeof v === "string" && v.startsWith(value))
                : typeof orderValue === "string" && orderValue.startsWith(value);
        case "contain Words":
            return Array.isArray(orderValue)
                ? orderValue.some((v) => typeof v === "string" && v.includes(value))
                : typeof orderValue === "string" && orderValue.includes(value);
        default:
            return false;
    }
};

module.exports = { AutoShip };
