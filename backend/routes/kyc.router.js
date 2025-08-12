const verficationRouter = require('express').Router();
const verfication = require('../kyc/kyc.controller');

verficationRouter.use('/verfication', verfication);

module.exports = verficationRouter;