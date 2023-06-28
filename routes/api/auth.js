const authController = require('../../controllers/authController');
const express = require('express');
const router = express.Router();
const verifyJWT = require('../../middlewares/verifyJWT');
const passport = require('passport')

// router.route('/login')
//     .post(authController.handleLogin);

// router.route('/logout')
//     .get(verifyJWT, authController.handleLogout);

// router.route('/confirm-email')
//     .post(authController.handleConfirmEmail);

// router.route('/reset-password')
//     .patch(authController.handleResetPassword);

// router.route('/change-password')
//     .patch(authController.handleChangeForgotPass);

// router.route('/:userId/change-password')
//     .patch(verifyJWT, authController.handleChangePass);

//Passport
router.route('/google')
    .get(passport.authenticate('google', { scope: ['profile', 'email']}));

router.get('/login/failed', (req, res) => {
    res.status(401).json({
        success: false,
        message: 'Login failed',
    });
});

router.get('/login/success', (req, res) => {
    if(req.user){
        res.status(200).json({
            succes: true,
            message: "Login successful",
            user: req.user,
            cookies: req.cookies
        })
    }
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect(process.env.CLIENT_URL)
})

router.route("/google/callback")
    .get(passport.authenticate('google'), (req, res) => {
        res.cookie('profile', req.user.id, { httpOnly: false, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
        res.redirect(process.env.REDIRECT_URL);
    });

router.route('/facebook')
    .get(passport.authenticate('facebook', {scope: 'email'}));

router.route('/facebook/callback')
    .get(passport.authenticate('facebook'), (req, res) => {
        res.cookie('profile', req.user.id, { httpOnly: false, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
        res.send(req.user);
    })

module.exports = router;