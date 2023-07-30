const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const verifyJWT = require('../../middlewares/verifyJWT');
const verifyRoles = require('../../middlewares/verifyRoles');
const verifyAddressRequest = require('../../middlewares/verifyAddressRequest');
const addressController = require('../../controllers/addressController');
const ROLES = require('../../config/roles');

router.route('/signup')
    .post(userController.create);

router.route('/addresses')
    .post(verifyJWT, verifyRoles(ROLES.User), verifyAddressRequest, addressController.create);

router.route('/address/:id')
    .put(verifyJWT, verifyRoles(ROLES.User), verifyAddressRequest, addressController.update)
    .get(verifyJWT, verifyRoles(ROLES.User), addressController.getById)
    .delete(verifyJWT, verifyRoles(ROLES.User), addressController.remove);

router.route('/:id')
    .get(userController.getUserProfile)
    .post(userController.ping);
    
router.route('/:id/update-name')
    .patch(verifyJWT, userController.changeName);

module.exports = router;