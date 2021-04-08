"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
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
}, { versionKey: false });
userSchema.methods.comparePassword = (inputPassword, user, cb) => {
    if (inputPassword === user.password) {
        cb(null, true);
    }
    else {
        cb('error', false);
    }
};
exports.default = mongoose_1.model('users', userSchema, 'users');
