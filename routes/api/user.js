const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');

//User
router.route('/profile')
    .get(userController.getUserProfile);

module.exports = router;