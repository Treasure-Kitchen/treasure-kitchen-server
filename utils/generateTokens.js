const jwt = require('jsonwebtoken');

const generateAccessToken = (role, id, expiresIn) => {
    const roles = [role.role];
        //create JWT
        const accessToken = jwt.sign(
            { 
                "UserInfo": {
                    "id": id,
                    "roles": roles
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: expiresIn }
        );
    return accessToken;
};

const generateRefreshToken = (id, expiresIn) => {
    const refreshToken = jwt.sign(
        { "id": id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: expiresIn }
    );

    return refreshToken;
}

module.exports = {
    generateAccessToken,
    generateRefreshToken
}