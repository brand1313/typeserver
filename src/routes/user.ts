import express ,{Request, Response, NextFunction} from 'express';
import { Model } from 'mongoose';
import passport, {PassportStatic} from 'passport';

import { UserDocument } from '../lib/interfaces';
import jwt from '../passport/jwt';
import userModel from '../schema/user';



class UserController {
    
    private static instance:UserController;

    private url:string;
    private controller:express.IRouter;
    private userModel:Model<UserDocument,{}>;
    private passport:PassportStatic;

    constructor(){

        this.url = '/user';
        this.controller = express.Router();
        this.userModel = userModel;
        this.passport = passport;

        this.controller.get('/', this.userMain);
        this.controller.get('/allUsers', this.allUsers);
        
        //로그인

        //passport - local
        this.controller.post('/login', this.passport.authenticate('local'),this.login);

        //passport - 카카오
        this.controller.get('/auth/kakao', this.passport.authenticate('kakao'));
        this.controller.get('/kakao/oauth', this.passport.authenticate('kakao',{failureFlash:"http://localhost:8080/health"}), this.kakaoAuth);

        //passport - jwt 토큰 인증
        this.controller.post('/auth/token',this.passport.authenticate('jwt',{session:false}), (req:Request, res:Response) => {
            console.log(req.user);
            res.send('<h1>토큰 인증 성공<h1>');
        })

        this.controller.get('/logout', this.logout);

        if(!UserController.instance){
            UserController.instance = this;
        }

        return UserController.instance;
    }

    userMain = (req:Request, res:Response) => {
        res.send('<h1>사용자 페이지</h1>');
    }

    allUsers = (req:Request, res:Response) => {
        this.userModel.find((err:any, users:any) => {
            if(err){
                return res.send(400).send(err);
            }else{
                return res.send(users);
            }
        });
    }

    //로컬 로그인 : 로그인 하면서 토큰도 발행해준다.
    login = async (req:Request, res:Response) => {

        //로그인 성공하면 passport가 user를 req에 추가해준다.
        const user:UserDocument = req.user!; 

        //accessToken, refreshToken 발급
        const tokenObj = await jwt.sign(user); 

        res.cookie('token',tokenObj.token, {
            maxAge: 60000,
            httpOnly: true,
            secure: false
        })

        console.log(req.user);
        console.log(req.cookies);
        res.send('<h1>로그인 및 토큰 발행 성공<h1>');
    }

    //카카오 로그인
    kakaoAuth = (req:Request, res:Response) => {
        console.log(req.user);
        res.send('<h1>카카오 인증 성공!</h1>');
    }

    //로그아웃
    logout = (req:Request, res:Response) => {
        req.session.destroy((err:any) => {
            if(err){
                console.error(err);
                return res.send('<h1>로그아웃 실패<h1>');
            }
        });
        res.clearCookie('connect.sid');
        res.send('<h1>로그아웃 성공</h1>');
    }

    getInstance = async ():Promise<UserController> => {
        return this;
    }
}

const userRouterInit = async ():Promise<UserController> => {

    const userRouter = new UserController();
    return await userRouter.getInstance();

}

export { UserController, userRouterInit }