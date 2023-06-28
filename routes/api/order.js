const orderController = require('../../controllers/orderController');
const express = require('express');
const router = express.Router();
const verifyJWT = require('../../middlewares/verifyJWT');
const verifyRoles = require('../../middlewares/verifyRoles');
const ROLES = require('../../config/roles');
const validateOrderRequest = require('../../middlewares/validateOrderRequest');

router.route('/')
    .post(verifyJWT, verifyRoles(ROLES.User), validateOrderRequest, orderController.create)
    .get(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin, ROLES.Regular), orderController.getAll);

router.route('/:id')
    .get(verifyJWT, orderController.getById)
    .patch(verifyJWT, verifyRoles(ROLES.User), orderController.update)
    .delete(verifyJWT, verifyRoles(ROLES.User), orderController.remove);

router.route('/:id/pay')
    .patch(verifyJWT, verifyRoles(ROLES.User), orderController.pay);

router.route('/:userId/user')
    .get(verifyJWT, verifyRoles(ROLES.User), orderController.getByUserId);

module.exports = router;