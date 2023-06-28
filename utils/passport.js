const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
        done(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    User.findOne({ googleId: profile.id })
        .then((currentUser) => {
            if(currentUser){
                done(null, currentUser);
            } else {
                new User({
                    displayName: profile.displayName,
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    photo: profile.photos[0].value 
                }).save().then((newUser) => {
                    done(null, newUser);
                })
            }
        });
}));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'displayName', 'picture.type(large)', 'email']
}, async (token, refreshToken, profile, done) => {
    console.log(profile)
}));