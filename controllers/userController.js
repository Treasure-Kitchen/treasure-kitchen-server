const User = require('../models/User');
const { generateAccessToken } = require('../utils/generateTokens');

const getUserProfile = async (req, res) => {
    const userId = req.params.id;
    try {
        var user = await User.findOne({ _id: userId}).select('id displayName email photo role createdAt').exec();
        if(!user) return res.status(404).json({message: `No user found with the Id: ${userId}`});
        const accessToken = generateAccessToken(user.role, user._id, '1d');
        res.status(200).json({accessToken, user});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

module.exports = {
    getUserProfile
};