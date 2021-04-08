import http from 'http';
import createErrors from 'http-errors';
import path from 'path';
import express, {Request, Response, NextFunction, Errback} from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import * as dotenv from 'dotenv';
import passport, {PassportStatic} from 'passport';

import { BasicConfig } from './lib/interfaces';
import { Socket } from 'node:dgram';
import db from './lib/dbConn';
import passportConfig from './passport';

dotenv.config({path:path.join(__dirname,'/environment/.env')});

class ApiServer extends http.Server {
    
    private static instance:ApiServer;

    private app:express.Application;
    private config:BasicConfig;
    private currentConns:any;
    private busy:any;
    private stopping:boolean;
    private routes:Array<any>;
    private db:Function;
    private passport:PassportStatic;
    private passportConfig:Function;
    
    constructor(config:BasicConfig, routes:Array<any>){
        const app = express();
        super(app);

        this.app = app;
        this.config = config;
        this.currentConns = new Set();
        this.busy = new WeakSet();
        this.stopping = false;
        this.routes = routes;
        this.db = db;
        this.passport = passport;
        this.passportConfig = passportConfig;

        if(!ApiServer.instance){
            ApiServer.instance = this;
        }

        return ApiServer.instance;
    }

    applyRoutes(routes:Array<any>):void {

        routes.forEach(route => {
            this.app.use(route.url, route.controller);
        });
    }

    async start():Promise<ApiServer>{

        this.app.use(morgan('common'));
        this.db();

        this.app.use((req:Request, res:Response, next:NextFunction) => {
            this.busy.add(req.socket);
            console.log('클라이언트 요청 접수!');
            
            res.on('finish', () => {
                
                if(this.stopping) req.socket.end(); //여기를 이해해야 함 
                
                this.busy.delete(req.socket);
                console.log('클라이언트 요청처리 완료');
            });

            next();
        });

        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: true}));
        this.app.use(express.raw());
        this.app.use(express.text());

        this.app.use(cookieParser(process.env.COOKIE_SECRET));

        this.app.use(session({
            resave: false,
            saveUninitialized: false,
            secret: this.config.cookieSecret,
            cookie: {
                httpOnly: true,
                secure: false,
                maxAge: 24000 * 60 * 60 
            }
        }));

        this.app.use(this.passport.initialize());
        this.app.use(this.passport.session());

        this.passportConfig(this.passport);

        this.app.get('/health', (req:Request, res:Response) => {
            if(this.listening) res.send('<h1>서버 정상 작동 중</h1>');            
        });

        this.applyRoutes(this.routes);

        this.app.use((req:Request, res:Response, next:NextFunction) => {
            next(createErrors(404));
        });

        this.app.use(this.errorHandler);

        this.on('connection', (socket:Socket) => {
            this.currentConns.add(socket);
            console.log('클라이언트 접속!');

            socket.on('close', () => {
                this.currentConns.delete(socket);
                console.log('클라이언트 연결 해제!');
            });
        });

        return this;
    }

    shutdown():void{
        
        if(this.stopping) {
            console.log('이미 서버 종료 중입니다...');
            return;
        }

        this.stopping = true;

        //여기도 다시 공부!! 왜 이렇게 되나??
        //아마도 종료 전에 작업을 모두 처리하는 듯 그래서 아래 currentConns 종료 작업이 실행되나?
        this.close((err:Error|undefined) => {
            if(err){
                console.log('서버 종료 중 에러 발생');
            }else{
                console.log('서버 종료 - 정상 종료');
                process.exit(0);
            }
        });

        setTimeout(() => {
            console.log('서버 종료 - 강제 종료');
            process.exit(1);
        },this.config.shutdownTimeout).unref();


        
        if(this.currentConns.size > 0){
            console.log(`현재 접속 중인 연결 ${this.currentConns.size}개 종료 중입니다.`);

            for(const con of this.currentConns){
                if(!this.busy.has(con)){
                    console.log('순차적 종료!');
                    con.end();
                }else{
                    console.log('아직 요청 처리 중입니다!');
                }
            }
        }
    }

    errorHandler(err:any, req:Request, res:Response, next:Errback){
        res.locals.message = err.message;
        res.locals.error = err;
        res.status(err.status || 500);
        res.send('<h1>에러발생</h1>');
    }
}

const init = async (config:BasicConfig, routes:Array<any>):Promise<ApiServer> => {
    
    const server = new ApiServer(config, routes);
    return await server.start();

}

export {
    ApiServer, init
}