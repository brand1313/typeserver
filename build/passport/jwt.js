"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rand_token_1 = __importDefault(require("rand-token"));
const config_1 = __importDefault(require("../lib/config"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwtConfig = config_1.default.jwtConfig();
const secretKey = jwtConfig.secretKey;
const options = jwtConfig.option;
const TOKEN_EXPIRED = -3;
const TOKEN_INVALID = -2;
//sign할 땐 유저객체,
//verify할 땐 토큰 전달
const sign = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = {
        userId: user.userId,
        email: user.email
    };
    const result = {
        token: jsonwebtoken_1.default.sign(payload, secretKey, options),
        refreshToken: rand_token_1.default.uid(256)
    };
    return result;
});
const verify = (token) => __awaiter(void 0, void 0, void 0, function* () {
    let decode;
    try {
        decode = jsonwebtoken_1.default.verify(token, secretKey);
    }
    catch (error) {
        if (error.message === 'jwt expired') {
            console.log('토큰 만료');
            return TOKEN_EXPIRED;
        }
        else if (error.message === 'invalid token') {
            console.log('유효하지 않은 토큰');
            return TOKEN_INVALID;
        }
        else {
            console.log('유효하지 않은 토큰');
        }
    }
    return decode;
});
exports.default = {
    sign, verify
};
