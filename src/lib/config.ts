import { BasicConfig, JWTConfig } from "./interfaces"

export default {
    
    basicConfig : ():BasicConfig => {
        return {
            port: process.env.PORT || 8000,
            shutdownTimeout: 10000,
            cookieSecret: process.env.COOKIE_SECRET || 'test'
        }
    },
    jwtConfig : ():JWTConfig => { 
        return {
            secretKey: process.env.JWT_SECRET,
            option: { //SignOptions 인터페이스에 있다.
                algorithm: 'HS256',
                expiresIn: '1m',
                issuer: 'brand13'
            }
        }
    }
}

