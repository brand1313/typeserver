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
const config_1 = __importDefault(require("./lib/config"));
const server_1 = require("./server");
const user_1 = require("./routes/user");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const userRoutes = yield user_1.userRouterInit();
    /** 필요한 라우터는 여기서 추가 후 배열에 넣는다. */
    const routes = [userRoutes];
    const basicConfig = config_1.default.basicConfig();
    const server = yield server_1.init(basicConfig, routes);
    server.listen(basicConfig.port, () => {
        console.log(`running server at ${basicConfig.port}`);
    });
    process.on('SIGTERM', () => server.shutdown());
    process.on('SIGINT', () => server.shutdown());
});
main();
