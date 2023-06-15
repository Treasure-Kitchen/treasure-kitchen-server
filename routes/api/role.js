const express = require('express');
const router = express.Router();
const roleController = require('../../controllers/roleController');
const verifyJWT = require('../../middlewares/verifyJWT');
const verifyRoles = require('../../middlewares/verifyRoles');
const ROLES = require('../../config/roles');

router.route('/')
    .post(verifyJWT, verifyRoles(ROLES.SuperAdmin), roleController.create)
    .get(roleController.getAll);

router.route('/:id')
    .get(verifyJWT, verifyRoles(ROLES.Admin, ROLES.SuperAdmin), roleController.getById)
    .put(verifyJWT, verifyRoles(ROLES.SuperAdmin), roleController.update)
    .delete(verifyJWT, verifyRoles(ROLES.SuperAdmin), roleController.remove);

module.exports = router;