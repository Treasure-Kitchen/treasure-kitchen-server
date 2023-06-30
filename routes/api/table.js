const express = require('express');
const router = express.Router();
const tablesController = require('../../controllers/tableController');
const verifyJWT = require('../../middlewares/verifyJWT');
const verifyRoles = require('../../middlewares/verifyRoles');
const ROLES = require('../../config/roles');
const validateTableRequest = require('../../middlewares/validateTableRequest');

router.route('/')
    .post(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), validateTableRequest, tablesController.create)
    .get(tablesController.getAll);

router.route('/available')
    .get(tablesController.getAvailable);

router.route('/:id')
    .get(tablesController.getById)
    .patch(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), validateTableRequest, tablesController.update)
    .delete(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), tablesController.remove);

module.exports = router;