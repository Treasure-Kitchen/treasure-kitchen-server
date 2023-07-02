const durationController = require('../../controllers/durationController');
const verifyDuration = require('../../middlewares/validateDurationRequests');
const express = require('express');
const verifyJWT = require('../../middlewares/verifyJWT');
const verifyRoles = require('../../middlewares/verifyRoles');
const ROLES = require('../../config/roles');
const router = express.Router();

router.route('/')
    .post(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), verifyDuration, durationController.create)
    .get(durationController.getAll);

router.route('/:id')
    .put(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), verifyDuration, durationController.update)
    .delete(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), durationController.remove);

module.exports = router;