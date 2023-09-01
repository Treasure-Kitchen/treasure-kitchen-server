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

router.route('/user')
    .get(verifyJWT, verifyRoles(ROLES.User), orderController.getByUserId);

router.route('/user-has-order')
    .get(verifyJWT, verifyRoles(ROLES.User), orderController.isUserHasOrders);

router.route('/:id')
    .get(verifyJWT, orderController.getById)
    .put(verifyJWT, verifyRoles(ROLES.User), orderController.update)
    .delete(verifyJWT, verifyRoles(ROLES.User), orderController.remove);

router.route('/:id/complete')
    .patch(verifyJWT, verifyRoles(ROLES.Admin, ROLES.Regular, ROLES.SuperAdmin), orderController.completeOrder)

router.route('/:id/cancel')
    .patch(verifyJWT, verifyRoles(ROLES.User), orderController.cancelOrder)

router.route('/:id/pay')
    .patch(verifyJWT, verifyRoles(ROLES.User), orderController.pay);

router.route('/:orderId/tracks')
    .get(verifyJWT, verifyRoles(ROLES.User), orderController.getOrderTrack);

module.exports = router;