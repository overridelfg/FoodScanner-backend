const jwt = require('jsonwebtoken');
const config = require('../config')

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if(!authHeader){
        res.status(401).json({error : 'Token not provided!'});
        return;
    }

    const token = authHeader.replace('Bearer ', '');
    try{
        const payload = jwt.verify(token, config.server.jwt.secret)
        if(payload.type !== 'access'){
            res.status(400).json({error: 'Invalid token!'})
        }
    }catch (err){
        if(err instanceof jwt.TokenExpiredError){
            res.status(401).json({error : 'Token expired!'});
        }
        if(err instanceof jwt.JsonWebTokenError){
            res.status(400).json({error : 'Invalid Token!'});
        }
    }
    next();
}
