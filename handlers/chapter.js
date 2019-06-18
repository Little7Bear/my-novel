const Chapter = require('../models/chapter.js')
const Novel = require('../models/novel.js')
const ObjectId = require('mongodb').ObjectID

exports.get = (req, res, next) => {
    let bookId = req.params.bookId || null
    let minSort = 0
    let maxSort = 0
    let sort = 0

    try {
        // 查询这本小说的最小、最大sort
        Chapter.aggregate([{
            $match: {
                bookId: ObjectId(bookId)
            }
        }, {
            $sort: {
                sort: 1
            }
        }, {
            $project: {
                sort: 1,
                _id: 0
            }
        }]).then(docs => {
            minSort = Number.parseInt(docs[0].sort)
            maxSort = Number.parseInt(docs[docs.length - 1].sort)

            // 查询redis里存储的小说进度
            req.db.get(bookId, async (err, reply) => {
                sort = Number.parseInt(reply) || minSort

                // 找到之前看的章并渲染返回页面
                await Chapter.findOne({
                    bookId: bookId,
                    sort: sort
                }).then(data => {
                    res.render('chapter.html', {
                        chapter: data,
                        minSort: minSort,
                        maxSort: maxSort
                    })
                })
            })
        })

    } catch (error) {
        next(error)
    }

}

exports.post = async (req, res, next) => {
    let bookId = req.params.bookId || null
    let sort = req.body.sort || null

    try {
        // 存储当前章的sort到redis中
        req.db.set(bookId, sort)

        await Chapter.findOne({
            bookId: bookId,
            sort: sort
        }).then(data => {
            res.json({
                book: {
                    title: data.title,
                    content: data.content,
                    sort: data.sort
                }
            })
        })
    } catch (error) {
        next(error)
    }

}

exports.catalog = async (req, res, next) => {
    let bookId = req.params.bookId || null
    let bookName = ''
    try {
        await Novel.findById(ObjectId(bookId)).then(data => {
            bookName = data.bookName
        })

        Chapter.aggregate([{
            $match: {
                bookId: ObjectId(bookId)
            }
        }, {
            $sort: {
                sort: 1
            }
        }, {
            $project: {
                title: 1,
                sort: 1,
                _id: 0
            }
        }], (err, docs) => {
            res.json({
                chapters: docs,
                bookName: bookName
            })
        })
    } catch (error) {
        next(error)
    }
}