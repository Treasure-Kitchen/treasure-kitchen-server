const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const verifyUserRegistration = require('../../middlewares/verifyUserRegistration');
const verifyJWT = require('../../middlewares/verifyJWT');

router.route('/signup')
    .post(userController.create);

router.route('/:id')
    .get(userController.getUserProfile)
    .post(userController.ping);
    
router.route('/:id/update-name')
    .patch(verifyJWT, userController.changeName);

module.exports = router;