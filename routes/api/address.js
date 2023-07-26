const express = require('express');
const router = express.Router();
const addressController = require('../../controllers/addressController');
const verifyJWT = require('../../middlewares/verifyJWT');
const verifyRoles = require('../../middlewares/verifyRoles');
const ROLES = require('../../config/roles');
const verifyAddressRequest = require('../../middlewares/verifyAddressRequest');

// router.route('/')
//     .post(verifyJWT, verifyRoles(ROLES.User), verifyAddressRequest, addressController.create);
    
router.route('/:id')
    .put(verifyJWT, verifyRoles(ROLES.User), verifyAddressRequest, addressController.update)
    .get(verifyJWT, verifyRoles(ROLES.User), addressController.getById)
    .delete(verifyJWT, verifyRoles(ROLES.User), addressController.remove);

module.exports = router;