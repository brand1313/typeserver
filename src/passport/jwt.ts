import randToken from 'rand-token';
import config from '../lib/config';
import jwt from 'jsonwebtoken';
import { JWTPayload, UserDocument } from '../lib/interfaces';

const jwtConfig = config.jwtConfig();
const secretKey = jwtConfig.secretKey;
const options   = jwtConfig.option;
const TOKEN_EXPIRED = -3;
const TOKEN_INVALID = -2;

//sign할 땐 유저객체,
//verify할 땐 토큰 전달

const sign = async (user:UserDocument) => {
    
    const payload:JWTPayload = {
        userId: user.userId,
        email: user.email
    }

    const result = {
        token: jwt.sign(payload, secretKey!, options),
        refreshToken: randToken.uid(256)
    }

    return result;
}

const verify = async (token:string) => {
    
    let decode;

    try {
        decode = jwt.verify(token, secretKey!);
    } catch (error) {
        if(error.message === 'jwt expired'){
            console.log('토큰 만료');
            return TOKEN_EXPIRED;
        }
        else if(error.message === 'invalid token'){
            console.log('유효하지 않은 토큰');
            return TOKEN_INVALID;
        }
        else{
            console.log('유효하지 않은 토큰');
        }
    }

    return decode;
}

export default {
    sign, verify
}