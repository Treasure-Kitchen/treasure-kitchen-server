const jwt = require('jsonwebtoken');

const getLoggedInUserId = (req) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = authHeader.split(' ')[1];
    let userId = '';
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if(err) return res.sendStatus(403);
            userId = decoded.UserInfo.id;
        }
    );

    return userId;
}

module.exports = {
    getLoggedInUserId
};