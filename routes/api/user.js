const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const verifyJWT = require('../../middlewares/verifyJWT');
const verifyRoles = require('../../middlewares/verifyRoles');
const ROLES = require('../../config/roles');
const validateUserRequest = require('../../middlewares/validateUserRequest');

router.route('/')
    .post(validateUserRequest, userController.create);

router.route('/:id')
    .patch(verifyJWT, verifyRoles(ROLES.User), userController.updateName);