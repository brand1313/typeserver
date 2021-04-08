import { model, Schema } from "mongoose";
import { comparePassword, UserDocument } from "../lib/interfaces";

const userSchema = new Schema({
   userId: {
       type: String,
       required: true,
   },
   username: String,
   email: String,
   provider: {
       type: String,
       required: true
   },
   password: String 
},{versionKey: false});

userSchema.methods.comparePassword = (inputPassword:string, user:UserDocument, cb:comparePassword):any => {
    if(inputPassword === user.password){
        cb(null, true);
    }else{
        cb('error', false);
    }
}

export default model<UserDocument>('users',userSchema,'users');