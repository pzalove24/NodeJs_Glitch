const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const handleLogin = async (req, res) => {
    const { user, pwd } = req.body;
    if (!user || !pwd) return res.status(400).json({ 
        'message ': 'Username and password are required'});
    const foundUser = await User.findOne({username: user}).exec();
    if (!foundUser) return res.sendStatus(401); //Unauthorized
    // evaluate password
    const match = await bcrypt.compare(pwd, foundUser.password)
    if (match) {
        //grab the roles
        const roles = Object.values(foundUser.roles);
        // create JWTs
        const accessToken = jwt.sign(
            { 
                "UserInfo" : {
                "username": foundUser.username,
                "roles": roles
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '30s' }
        );
        const refreshToken = jwt.sign(
            { "username": foundUser.username },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );
        // Saving refreshToken with currentUser
        foundUser.refreshToken = refreshToken;
        const result = await foundUser.save();
        console.log(result);

        //cookie is available to javascript attack but not with cookieHttpOnly
        //when testing with thunderclient, take secure: true out, don't need it
        //but when in chrome or production, must have that secure: true
        res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', maxAge: 24*60*60*1000}); //secure: true
        res.json({ accessToken })
    } else {
        res.sendStatus(401);
    }

}

module.exports = { handleLogin };