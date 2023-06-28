const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');

router.route('/:id')
    .get(userController.getUserProfile);

module.exports = router;