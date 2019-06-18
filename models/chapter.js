const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let chapterSchema = new Schema({
    bookId: {
        type: Schema.Types.ObjectId,
        ref: 'Novel',
        required: true
    },
    title: {
        type: String,
        default: '',
    },
    content: {
        type: String,
        default: '',
    },
    sort: Number
});

module.exports = mongoose.model('Chapter', chapterSchema)