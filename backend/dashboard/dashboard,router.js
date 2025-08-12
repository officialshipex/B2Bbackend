const express = require('express');
const router = express.Router();

const {dashboard,getBusinessInsights,getDashboardOverview,getOverviewGraphsData,getOverviewCardData,getOrderSummary,getOrdersGraphsData,getRTOSummaryData,getRTOGraphsData}=require("./dashboard.controller")


router.get("/dashboard",dashboard)
router.get("/getBusinessInsights",getBusinessInsights)
router.get("/getDashboardOverview",getDashboardOverview)
router.get("/getOverviewGraphsData",getOverviewGraphsData)
router.get("/getOverviewCardData",getOverviewCardData)
router.get("/getOrderSummary",getOrderSummary)
router.get("/getOrdersGraphsData",getOrdersGraphsData)
router.get("/getRTOSummaryData",getRTOSummaryData)
router.get("/getRTOGraphsData",getRTOGraphsData)

module.exports = router;