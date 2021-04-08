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
const passport_local_1 = __importDefault(require("passport-local"));
const passport_kakao_1 = require("passport-kakao");
const passport_jwt_1 = __importDefault(require("passport-jwt"));
const user_1 = __importDefault(require("../schema/user"));
const config_1 = __importDefault(require("../lib/config"));
const LocalStrategy = passport_local_1.default.Strategy;
const KaKaoStrategy = passport_kakao_1.Strategy;
const JWTStrategy = passport_jwt_1.default.Strategy;
const ExtractJwt = passport_jwt_1.default.ExtractJwt;
class PassportStrategy {
    constructor(passport) {
        this.start = () => __awaiter(this, void 0, void 0, function* () {
            this.passport.serializeUser((req, user, done) => {
                done(null, user._id);
            });
            this.passport.deserializeUser((id, done) => {
                this.userModel.findById(id, (err, user) => {
                    done(err, user);
                });
            });
            this.local();
            this.kakao();
            this.jwtAuth();
        });
        this.local = () => {
            this.passport.use(new LocalStrategy({
                usernameField: 'userId',
                passwordField: 'password',
                session: true,
                passReqToCallback: false
            }, (userId, password, done) => {
                this.userModel.findOne({ userId: userId }, (err, user) => {
                    if (err) {
                        return done(err);
                    }
                    if (!user) {
                        user = new this.userModel({
                            userId: userId,
                            password: password,
                            provider: 'local'
                        });
                        user.save(err => {
                            if (err)
                                console.error(err);
                            return done(err, user);
                        });
                    }
                    else {
                        console.log('이미 존재하는 유저');
                        return user.comparePassword(password, user, (passErr, isMatch) => {
                            if (isMatch)
                                return done(null, user);
                            return done(null, false, { message: '비밀번호 오류' });
                        });
                    }
                });
            }));
        };
        this.kakao = () => {
            this.passport.use(new KaKaoStrategy({
                clientID: process.env.KAKAO_CLIENT_ID,
                callbackURL: 'http://localhost:8080/user/kakao/oauth',
                clientSecret: process.env.KAKAO_CLIENT_SECRET
            }, (accessToken, refreshToken, profile, done) => {
                console.log(profile);
                this.userModel.findOne({ userId: profile.id }, (err, user) => {
                    if (err)
                        return done(err);
                    if (!user) {
                        user = new this.userModel({
                            userId: profile.id,
                            username: profile.username,
                            email: profile._json.kakao_account.email,
                            provider: profile.provider
                        });
                        user.save(err => {
                            if (err) {
                                console.error(err);
                                return done(err);
                            }
                            return done(null, user);
                        });
                    }
                    else {
                        console.log('이미 존재하는 유저');
                        return done(null, user);
                    }
                });
            }));
        };
        this.jwtAuth = () => {
            this.passport.use(new JWTStrategy({
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: config_1.default.jwtConfig().secretKey
            }, (jwtPayload, done) => {
                const userId = jwtPayload.userId;
                const email = jwtPayload.email;
                this.userModel.findOne({ userId: userId }, (err, user) => {
                    if (err) {
                        return done(err);
                    }
                    if (!user) {
                        console.log('존재하지 않는 아이디입니다. 회원가입 필요!!');
                        return;
                    }
                    else {
                        return done(null, user);
                    }
                });
            }));
        };
        this.passport = passport;
        this.userModel = user_1.default;
        if (!PassportStrategy.instance) {
            PassportStrategy.instance = this;
        }
        return PassportStrategy.instance;
    }
}
const passportConfig = (passport) => __awaiter(void 0, void 0, void 0, function* () {
    const passportStrategy = new PassportStrategy(passport);
    yield passportStrategy.start();
});
exports.default = passportConfig;
