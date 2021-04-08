import { CallbackError, Model } from 'mongoose';
import { PassportStatic } from 'passport';
import passportLocal from 'passport-local';
import {Strategy} from 'passport-kakao';
import passportJWT from 'passport-jwt';
import { JWTPayload, UserDocument } from '../lib/interfaces';

import userModel from '../schema/user';
import config from '../lib/config';

const LocalStrategy = passportLocal.Strategy;
const KaKaoStrategy = Strategy;
const JWTStrategy   = passportJWT.Strategy;
const ExtractJwt    = passportJWT.ExtractJwt;

class PassportStrategy {

    private static instance:PassportStrategy;

    private passport:PassportStatic;
    private userModel:Model<UserDocument,{}>;

    constructor(passport:PassportStatic){

        this.passport = passport;
        this.userModel = userModel;
        
        if(!PassportStrategy.instance){
            PassportStrategy.instance = this;
        }

        return PassportStrategy.instance;
    }

    start = async() => {

        this.passport.serializeUser<any,any>((req:any, user, done)=>{ //여기서 user는 UserDocument 타입을 따르지 않는다.
            done(null, user._id);
        });

        this.passport.deserializeUser((id, done) => {
            this.userModel.findById(id, (err:CallbackError, user:UserDocument) => {
                done(err, user);
            });
        });

        this.local();
        this.kakao();
        this.jwtAuth();
    };

    local = () => {
        
        this.passport.use(new LocalStrategy({
            usernameField: 'userId',
            passwordField: 'password',
            session: true,
            passReqToCallback: false
        },(userId, password, done)=>{
            
            this.userModel.findOne({userId: userId},(err:CallbackError, user:UserDocument) => {

                if(err){
                    return done(err);
                }

                if(!user){
                    user = new this.userModel({
                        userId: userId,
                        password: password,
                        provider: 'local'
                    });

                    user.save(err => {
                        if(err) console.error(err);
                        return done(err, user);
                    })
                }else{
                    console.log('이미 존재하는 유저');

                    return user.comparePassword(password, user, (passErr:any, isMatch:boolean) => {
                        
                        if(isMatch) return done(null, user);

                        return done(null, false, {message: '비밀번호 오류'});
                    });
                }
            });
        }));
    }

    kakao = () => {
        this.passport.use(new KaKaoStrategy({
            clientID: process.env.KAKAO_CLIENT_ID!,
            callbackURL: 'http://localhost:8080/user/kakao/oauth',
            clientSecret: process.env.KAKAO_CLIENT_SECRET!
        },(accessToken, refreshToken, profile, done) => {

            console.log(profile);

            this.userModel.findOne({userId:profile.id}, (err:any, user:UserDocument) => {

                if(err) return done(err);

                if(!user){
                    user = new this.userModel({
                        userId: profile.id,
                        username: profile.username,
                        email: profile._json.kakao_account.email,
                        provider: profile.provider
                    });

                    user.save(err => {
                        if(err) {
                            console.error(err);
                            return done(err);
                        }

                       return done(null, user);
                    });
                }else{
                    console.log('이미 존재하는 유저');
                    return done(null, user);
                }
            });
        }));
    }

    jwtAuth = () => {
        this.passport.use(new JWTStrategy({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.jwtConfig().secretKey
        },(jwtPayload:JWTPayload, done) => {
            const userId = jwtPayload.userId;
            const email = jwtPayload.email;

            this.userModel.findOne({userId:userId}, (err:any, user:UserDocument) => {
                if(err){
                    return done(err);
                }

                if(!user){
                    console.log('존재하지 않는 아이디입니다. 회원가입 필요!!');
                    return;
                }else{
                    return done(null, user);
                }
            })
        }));
    }
}

const passportConfig = async (passport:PassportStatic) => {

    const passportStrategy = new PassportStrategy(passport);
    await passportStrategy.start();

}

export default passportConfig;