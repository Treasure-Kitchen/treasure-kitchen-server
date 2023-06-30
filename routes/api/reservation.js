const ROLES = require('../../config/roles');
const reservationController = require('../../controllers/reservationController');
const validateReservationRequest = require('../../middlewares/validateReservationRequest');
const verifyJWT = require('../../middlewares/verifyJWT');
const verifyRoles = require('../../middlewares/verifyRoles');
const router = require('express').Router();

router.route('/')
    .post(verifyJWT, verifyRoles(ROLES.User), validateReservationRequest, reservationController.create);

router.route('/:id/table-size')
    .patch(verifyJWT, verifyRoles(ROLES.User), validateReservationRequest, reservationController.updateTableAndPartySize);

router.route('/:id/time-duration')
    .patch(verifyJWT, verifyRoles(ROLES.User), validateReservationRequest, reservationController.updateTimeAndDuration);

module.exports = router;