const jwt = require('jsonwebtoken');

const generateAccessToken = (role, id, expiersIn) => {
    const roles = [role];
        //create JWT
        const accessToken = jwt.sign(
            { 
                "UserInfo": {
                    "id": id,
                    "roles": roles
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: expiersIn }
        );
    return accessToken;
};

const generateRefreshToken = (id, expiersIn) => {
    const refreshToken = jwt.sign(
        { "id": id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: expiersIn }
    );

    return refreshToken;
}

module.exports = {
    generateAccessToken,
    generateRefreshToken
}