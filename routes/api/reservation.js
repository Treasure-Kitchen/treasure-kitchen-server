const ROLES = require('../../config/roles');
const reservationController = require('../../controllers/reservationController');
const validateReservationRequest = require('../../middlewares/validateReservationRequest');
const verifyJWT = require('../../middlewares/verifyJWT');
const verifyRoles = require('../../middlewares/verifyRoles');
const router = require('express').Router();

router.route('/')
    .post(verifyJWT, verifyRoles(ROLES.User), validateReservationRequest, reservationController.create)
    .get(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin, ROLES.Regular), reservationController.getAll);

router.route('/user')
    .get(verifyJWT, verifyRoles(ROLES.User), reservationController.getByUserEmail);

router.route('/user-has-reservation')
    .get(verifyJWT, verifyRoles(ROLES.User), reservationController.userHasReservation);

router.route('/:id/cancel')
    .patch(verifyJWT, verifyRoles(ROLES.User), reservationController.cancelReservation);

router.route('/:id/table-size')
    .patch(verifyJWT, verifyRoles(ROLES.User), reservationController.updateTableAndPartySize);

router.route('/:id/time-duration')
    .patch(verifyJWT, verifyRoles(ROLES.User), reservationController.updateTimeAndDuration);

router.route('/:id/confirm')
    .put(verifyJWT, verifyRoles(ROLES.User), reservationController.confirmReservation);

module.exports = router;