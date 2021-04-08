"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.init = exports.ApiServer = void 0;
const http_1 = __importDefault(require("http"));
const http_errors_1 = __importDefault(require("http-errors"));
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv = __importStar(require("dotenv"));
const passport_1 = __importDefault(require("passport"));
const dbConn_1 = __importDefault(require("./lib/dbConn"));
const passport_2 = __importDefault(require("./passport"));
dotenv.config({ path: path_1.default.join(__dirname, '/environment/.env') });
class ApiServer extends http_1.default.Server {
    constructor(config, routes) {
        const app = express_1.default();
        super(app);
        this.app = app;
        this.config = config;
        this.currentConns = new Set();
        this.busy = new WeakSet();
        this.stopping = false;
        this.routes = routes;
        this.db = dbConn_1.default;
        this.passport = passport_1.default;
        this.passportConfig = passport_2.default;
        if (!ApiServer.instance) {
            ApiServer.instance = this;
        }
        return ApiServer.instance;
    }
    applyRoutes(routes) {
        routes.forEach(route => {
            this.app.use(route.url, route.controller);
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.app.use(morgan_1.default('common'));
            this.db();
            this.app.use((req, res, next) => {
                this.busy.add(req.socket);
                console.log('클라이언트 요청 접수!');
                res.on('finish', () => {
                    if (this.stopping)
                        req.socket.end(); //여기를 이해해야 함 
                    this.busy.delete(req.socket);
                    console.log('클라이언트 요청처리 완료');
                });
                next();
            });
            this.app.use(express_1.default.json());
            this.app.use(express_1.default.urlencoded({ extended: true }));
            this.app.use(express_1.default.raw());
            this.app.use(express_1.default.text());
            this.app.use(cookie_parser_1.default(process.env.COOKIE_SECRET));
            this.app.use(express_session_1.default({
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
            this.app.get('/health', (req, res) => {
                if (this.listening)
                    res.send('<h1>서버 정상 작동 중</h1>');
            });
            this.applyRoutes(this.routes);
            this.app.use((req, res, next) => {
                next(http_errors_1.default(404));
            });
            this.app.use(this.errorHandler);
            this.on('connection', (socket) => {
                this.currentConns.add(socket);
                console.log('클라이언트 접속!');
                socket.on('close', () => {
                    this.currentConns.delete(socket);
                    console.log('클라이언트 연결 해제!');
                });
            });
            return this;
        });
    }
    shutdown() {
        if (this.stopping) {
            console.log('이미 서버 종료 중입니다...');
            return;
        }
        this.stopping = true;
        //여기도 다시 공부!! 왜 이렇게 되나??
        //아마도 종료 전에 작업을 모두 처리하는 듯 그래서 아래 currentConns 종료 작업이 실행되나?
        this.close((err) => {
            if (err) {
                console.log('서버 종료 중 에러 발생');
            }
            else {
                console.log('서버 종료 - 정상 종료');
                process.exit(0);
            }
        });
        setTimeout(() => {
            console.log('서버 종료 - 강제 종료');
            process.exit(1);
        }, this.config.shutdownTimeout).unref();
        if (this.currentConns.size > 0) {
            console.log(`현재 접속 중인 연결 ${this.currentConns.size}개 종료 중입니다.`);
            for (const con of this.currentConns) {
                if (!this.busy.has(con)) {
                    console.log('순차적 종료!');
                    con.end();
                }
                else {
                    console.log('아직 요청 처리 중입니다!');
                }
            }
        }
    }
    errorHandler(err, req, res, next) {
        res.locals.message = err.message;
        res.locals.error = err;
        res.status(err.status || 500);
        res.send('<h1>에러발생</h1>');
    }
}
exports.ApiServer = ApiServer;
const init = (config, routes) => __awaiter(void 0, void 0, void 0, function* () {
    const server = new ApiServer(config, routes);
    return yield server.start();
});
exports.init = init;
