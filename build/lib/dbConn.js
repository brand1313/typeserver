"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dbconn = () => {
    const connect = () => {
        const db = 'mongodb://localhost:27017/user';
        mongoose_1.default.connect(db, { useUnifiedTopology: true, useNewUrlParser: true }, (err) => {
            if (err) {
                console.error(`error - 몽구스 디비 연결 에러`, err);
            }
            console.log(`몽고 DB 연결 성공`);
        });
    };
    connect();
    mongoose_1.default.connection.on('disconnected', connect);
};
exports.default = dbconn;
