const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    nickName: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    createdTime: {
        type: Date,
        default: Date.now,
    },
    lastModifiedTime: {
        type: Date,
        default: Date.now,
    },
    avatar: {
        type: String,
        default: '/public/img/default_ava.png',
    },
    bio: {
        type: String,
        default: '',
    },
    gender: {
        type: Number,
        enum: [0, 1, -1],
        default: -1,
    },
    birthday: {
        type: Date,
    },
    status: {
        type: Number,
        //0 无限制
        //1 无法评论
        //2 无法登录
        enum: [0, 1, 2],
        default: 0,
    },
});

module.exports = mongoose.model('User', userSchema)