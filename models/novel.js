const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate')
const moment = require('moment')

let novelSchema = new Schema({
    bookName: {
        type: String,
        required: true,
        index: true
    },
    author: {
        type: String,
        default: '',
    },
    category: {
        type: String,
        default: '',
    },
    description: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        default: '',
    },
    wordsNumber: {
        type: Number,
        default: 0,
    },
    cover: {
        type: String,
        default: '/public/img/no-picture.png',
    },
    lastUpdateTime: {
        type: Date,
        default: Date.now,
        get: v => moment(v).format('YYYY-MM-DD HH:mm')
    },
    latestChapter: {
        type: String,
        default: '',
    },
    readUrl: {
        type: String,
        default: '',
    },
    totalChapters: {
        type: Number,
        default: 0
    }
});

novelSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Novel', novelSchema)