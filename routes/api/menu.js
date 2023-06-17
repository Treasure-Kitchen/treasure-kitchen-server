const menuController = require('../../controllers/menuController');
const express = require('express');
const router = express.Router();
const verifyJWT = require('../../middlewares/verifyJWT');
const verifyRoles = require('../../middlewares/verifyRoles');
const ROLES = require('../../config/roles');


router.route('/')
    .post(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), menuController.create)
    .get(menuController.getAll);

router.route('/:id')
    .put(verifyJWT, verifyRoles(ROLES.SuperAdmin, ROLES.Admin), menuController.update)
    .get(menuController.getById)
    .delete(verifyJWT, verifyRoles(ROLES.SuperAdmin), menuController.remove);

module.exports = router;