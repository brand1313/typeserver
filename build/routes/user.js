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
exports.userRouterInit = exports.UserController = void 0;
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const jwt_1 = __importDefault(require("../passport/jwt"));
const user_1 = __importDefault(require("../schema/user"));
class UserController {
    constructor() {
        this.userMain = (req, res) => {
            res.send('<h1>사용자 페이지</h1>');
        };
        this.allUsers = (req, res) => {
            this.userModel.find((err, users) => {
                if (err) {
                    return res.send(400).send(err);
                }
                else {
                    return res.send(users);
                }
            });
        };
        //로컬 로그인 : 로그인 하면서 토큰도 발행해준다.
        this.login = (req, res) => __awaiter(this, void 0, void 0, function* () {
            //로그인 성공하면 passport가 user를 req에 추가해준다.
            const user = req.user;
            //accessToken, refreshToken 발급
            const tokenObj = yield jwt_1.default.sign(user);
            res.cookie('token', tokenObj.token, {
                maxAge: 60000,
                httpOnly: true,
                secure: false
            });
            console.log(req.user);
            console.log(req.cookies);
            res.send('<h1>로그인 및 토큰 발행 성공<h1>');
        });
        //카카오 로그인
        this.kakaoAuth = (req, res) => {
            console.log(req.user);
            res.send('<h1>카카오 인증 성공!</h1>');
        };
        //로그아웃
        this.logout = (req, res) => {
            req.session.destroy((err) => {
                if (err) {
                    console.error(err);
                    return res.send('<h1>로그아웃 실패<h1>');
                }
            });
            res.clearCookie('connect.sid');
            res.send('<h1>로그아웃 성공</h1>');
        };
        this.getInstance = () => __awaiter(this, void 0, void 0, function* () {
            return this;
        });
        this.url = '/user';
        this.controller = express_1.default.Router();
        this.userModel = user_1.default;
        this.passport = passport_1.default;
        this.controller.get('/', this.userMain);
        this.controller.get('/allUsers', this.allUsers);
        //로그인
        //passport - local
        this.controller.post('/login', this.passport.authenticate('local'), this.login);
        //passport - 카카오
        this.controller.get('/auth/kakao', this.passport.authenticate('kakao'));
        this.controller.get('/kakao/oauth', this.passport.authenticate('kakao', { failureFlash: "http://localhost:8080/health" }), this.kakaoAuth);
        //passport - jwt 토큰 인증
        this.controller.post('/auth/token', this.passport.authenticate('jwt', { session: false }), (req, res) => {
            console.log(req.user);
            res.send('<h1>토큰 인증 성공<h1>');
        });
        this.controller.get('/logout', this.logout);
        if (!UserController.instance) {
            UserController.instance = this;
        }
        return UserController.instance;
    }
}
exports.UserController = UserController;
const userRouterInit = () => __awaiter(void 0, void 0, void 0, function* () {
    const userRouter = new UserController();
    return yield userRouter.getInstance();
});
exports.userRouterInit = userRouterInit;
