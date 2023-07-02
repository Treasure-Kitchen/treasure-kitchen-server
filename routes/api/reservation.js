const ROLES = require('../../config/roles');
const reservationController = require('../../controllers/reservationController');
const validateReservationRequest = require('../../middlewares/validateReservationRequest');
const verifyJWT = require('../../middlewares/verifyJWT');
const verifyRoles = require('../../middlewares/verifyRoles');
const router = require('express').Router();

router.route('/')
    .post(verifyJWT, verifyRoles(ROLES.User), validateReservationRequest, reservationController.create)
    .get(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin, ROLES.Regular), reservationController.getAll);

router.route('/by-email')
    .get(verifyJWT, verifyRoles(ROLES.User), reservationController.getByUserEmail);

router.route('/test')
    .get(reservationController.tempTest);

router.route('/:id/cancel')
    .patch(verifyJWT, verifyRoles(ROLES.User), reservationController.cancelReservation);

router.route('/:id/table-size')
    .patch(verifyJWT, verifyRoles(ROLES.User), validateReservationRequest, reservationController.updateTableAndPartySize);

router.route('/:id/time-duration')
    .patch(verifyJWT, verifyRoles(ROLES.User), validateReservationRequest, reservationController.updateTimeAndDuration);

router.route('/id/confirm')
    .patch(verifyJWT, verifyRoles(ROLES.User), reservationController.confirmReservation);

module.exports = router;