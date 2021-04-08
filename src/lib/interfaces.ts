import { SignOptions } from 'jsonwebtoken';
import {Document} from 'mongoose';

export interface BasicConfig {
    port: string | number,
    shutdownTimeout: number,
    cookieSecret: string
}

export type comparePassword = (err:any, isMatch:boolean) => any;
type passportProvider = 'local' | 'kakao' | 'jwt';

export interface UserDocument extends Document {
    _id?:number,
    userId: string,
    useremail?: string,
    email?: string,
    provider: string,
    password?: passportProvider,
    comparePassword(inputPassword:string, user:UserDocument, cb:comparePassword):any
}

export interface JWTPayload {
    userId: string,
    email: string | undefined
}

export interface JWTConfig {
    secretKey: string | undefined,
    option: SignOptions
}