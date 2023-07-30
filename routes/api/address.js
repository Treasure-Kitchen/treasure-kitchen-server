const express = require('express');
const router = express.Router();
const addressController = require('../../controllers/addressController');
const verifyJWT = require('../../middlewares/verifyJWT');
const verifyRoles = require('../../middlewares/verifyRoles');
const ROLES = require('../../config/roles');

router.route('/countries')
    .post(verifyJWT, verifyRoles(ROLES.Admin, ROLES.SuperAdmin), addressController.createCountry)
    .get(verifyJWT, addressController.getCountries);

router.route('/countries/:countryId/states')
    .get(verifyJWT, addressController.getStatesByCountry);

router.route('/countries/:id')
    .put(verifyJWT, verifyRoles(ROLES.Admin, ROLES.SuperAdmin), addressController.updateCountry)
    .delete(verifyJWT, verifyRoles(ROLES.Admin, ROLES.SuperAdmin), addressController.removeCountry)
    .get(verifyJWT, addressController.getCountryById);

router.route('/states')
    .post(verifyJWT, verifyRoles(ROLES.Admin, ROLES.SuperAdmin), addressController.createState);

router.route('/states/:id')
    .get(verifyJWT, addressController.getStateById)
    .put(verifyJWT, verifyRoles(ROLES.Admin, ROLES.SuperAdmin), addressController.updateState)
    .delete(verifyJWT, verifyRoles(ROLES.Admin, ROLES.SuperAdmin), addressController.removeState)

module.exports = router;