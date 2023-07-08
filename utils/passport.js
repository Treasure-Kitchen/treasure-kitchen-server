const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { capitalizeFirstLetters } = require('../helpers/helperFs');
const Role = require('../models/Role');
const ROLES = require('../config/roles');

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
                User.findOneAndUpdate({ _id: currentUser._id }, { lastLogin: new Date() })
                    .then((user) => {
                        done(null, user);
                    })
            } else {
                Role.findOne({ role: ROLES.User })
                    .then((role) => {
                        if(role){
                            new User({
                                displayName: capitalizeFirstLetters(profile.displayName),
                                googleId: profile.id,
                                email: profile.emails[0].value,
                                photo: profile.photos[0].value,
                                role: role._id,
                                lastLogin: new Date()
                            }).save().then((newUser) => {
                                done(null, newUser);
                            })
                        }
                    }).catch(err => done(err, null));
            }
        });
}));