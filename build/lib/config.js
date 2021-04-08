"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    basicConfig: () => {
        return {
            port: process.env.PORT || 8000,
            shutdownTimeout: 10000,
            cookieSecret: process.env.COOKIE_SECRET || 'test'
        };
    },
    jwtConfig: () => {
        return {
            secretKey: process.env.JWT_SECRET,
            option: {
                algorithm: 'HS256',
                expiresIn: '1m',
                issuer: 'brand13'
            }
        };
    }
};
