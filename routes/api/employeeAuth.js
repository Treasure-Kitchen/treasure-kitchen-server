const authController = require('../../controllers/authController');
const express = require('express');
const router = express.Router();
const verifyJWT = require('../../middlewares/verifyJWT');

router.route('/login')
    .post(authController.handleLogin);

router.route('/logout')
    .get(verifyJWT, authController.handleLogout);

router.route('/confirm-email')
    .post(authController.handleConfirmEmail);

router.route('/reset-password')
    .patch(authController.handleResetPassword);

router.route('/change-password')
    .patch(authController.handleChangeForgotPass);

router.route('/:userId/change-password')
    .patch(verifyJWT, authController.handleChangePass);

module.exports = router;