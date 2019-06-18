const mongoose = require('mongoose')
const Novel = require('../models/novel.js')
const Chapter = require('../models/chapter.js')
const ObjectId = require('mongodb').ObjectID

// 事务
const Transaction = require('mongoose-transactions')
const transaction = new Transaction()

const Crawler = require("crawler")

const jsdom = require('jsdom')
const {
    JSDOM
} = jsdom

exports.page = async (req, res, next) => {
    try {
        let page = 1
        let limit = 10

        Novel.paginate({}, {
                page: page,
                limit: limit
            },
            (error, result) => {
                res.render('book.html', {
                    allNovels: result
                })
            }
        )
    } catch (error) {
        next(error)
    }
}

exports.getMore = async (req, res, next) => {
    try {
        let page = req.body.page
        let limit = 10
        let category = req.body.category || null
        page = parseInt(page)

        if (!category) {
            // 全部加载
            await Novel.paginate({}, {
                page: page,
                limit: parseInt(limit)
            }).then(result => {
                res.json(result)
            })
        } else {
            // 分类加载
            category = translate(category)
            const [results, total] = await Promise.all([
                Novel.find({
                    category: category
                }).limit(limit).skip((page - 1) * limit).lean().exec(),
                Novel.find({
                    category: category
                }).count({})
            ])
            const pages = Math.ceil(total / limit)

            res.json({
                docs: results,
                page: page,
                pages: pages
            })
        }

    } catch (error) {
        next(error)
    }
}

exports.update = async (req, res, next) => {
    let id = req.body.id || null
    let c = new Crawler()
    let book = null
    let addChpaterNumber = 0
    let preUrl = ''
    let dom = {}
    let article = {}
    let articleUrl = ''
    let articleTitle = ''
    let words = ''

    try {
        // 找到需要更新的书
        await Novel.findOne({
            _id: ObjectId(id)
        }).then(data => {
            book = data
        })

        // 用爬虫访问这本书的阅读地址
        c.queue([{
            uri: book.readUrl,
            callback: async function (error, response, done) {
                if (error) {
                    next(error)
                }

                let $ = response.$
                let allATags = $('dd>a')
                addChpaterNumber = allATags.length - book.totalChapters

                // 判断是否有更新的章节
                if (addChpaterNumber > 0) {
                    article.bookId = book._id
                    preUrl = book.readUrl.substring(0, book.readUrl.lastIndexOf('/') + 1)

                    // 爬取更新的章节
                    for (let index = book.totalChapters; index < allATags.length; index++) {
                        articleUrl = preUrl + allATags[index].attribs.href
                        articleTitle = allATags[index].children[0].data

                        c.queue({
                            jQuery: false,
                            uri: articleUrl,
                            articleTitle: articleTitle,
                            sort: index,
                            callback: async (err, res, done) => {
                                if (err) {
                                    console.error(err.stack)
                                } else {
                                    // 保存更新的章节
                                    dom = new JSDOM(res.body)
                                    article.content = dom.window.document.querySelector("#content").innerHTML
                                    article.title = res.options.articleTitle
                                    article.sort = res.options.sort
                                    await new Chapter(article).save()
                                    console.log(article.title)
                                }
                                done()
                            }
                        })
                    }

                    // 更新书本信息
                    book.status = $('meta[property="og:novel:status"]').attr("content")
                    words = $('.small span:contains("字数")').text()
                    book.wordsNumber = Number.parseInt(words.substring(words.indexOf('：') + 1))
                    book.lastUpdateTime = $('meta[property="og:novel:update_time"]').attr("content")
                    book.latestChapter = $('meta[property="og:novel:latest_chapter_name"]').attr("content")
                    book.totalChapters = allATags.length

                    await Novel.update({
                        _id: book._id
                    }, book)

                }
                done()
            }
        }])

        c.on('drain', function () {
            if (addChpaterNumber > 0) {
                res.json({
                    status: 0,
                    addChpaterNumber: addChpaterNumber,
                    book: {
                        status: book.status,
                        lastUpdateTime: book.lastUpdateTime,
                        latestChapter: book.latestChapter
                    }
                })
            } else {
                res.json({
                    status: 0,
                    addChpaterNumber: addChpaterNumber,
                    book: null
                })
            }
        })

    } catch (error) {
        next(error)
    }

}

exports.del = async (req, res, next) => {
    let id = req.query.id || null

    try {
        transaction.remove('Novel', ObjectId(id))

        await Chapter.find({
            bookId: ObjectId(id)
        }).then(data => {
            for (const i in data) {
                if (data.hasOwnProperty(i)) {
                    const element = data[i]
                    transaction.remove('Chapter', element._id)
                }
            }
        })

        await transaction.run()

        res.json({
            status: 0,
            msg: '删除成功'
        })
    } catch (error) {
        console.error(error)
        console.log('删除遇到错误，开始回滚')
        await transaction.rollback().catch(console.error)
    } finally {
        transaction.clean()
    }

}

exports.categoryNovel = async (req, res, next) => {
    let category = req.query.category || null
    let limit = 10

    try {
        category = translate(category)

        Novel.aggregate([{
            $match: {
                category: category
            }
        }, {
            $limit: limit
        }], (err, docs) => {
            if (err) {
                next(err)
            }
            res.json({
                books: docs
            })
        })
    } catch (error) {
        next(error)
    }

}

exports.search = async (req, res, next) => {
    let val = req.body.val || null
    try {
        await Novel.find({
            $or: [{
                    bookName: val
                },
                {
                    author: val
                }
            ]
        }).then(data => {
            res.json({
                docs: data
            })
        })
    } catch (error) {
        next(error)
    }
}

function translate(category) {
    switch (category) {
        case '玄幻':
            category = '玄幻魔法';
            break;
        case '武侠':
            category = '武侠修真';
            break;
        case '都市':
            category = '都市言情';
            break;
        case '历史':
            category = '历史军事';
            break;
        case '侦探':
            category = '侦探推理';
            break;
        case '网游':
            category = '网游动漫';
            break;
        case '科幻':
            category = '科幻灵异';
            break;
        case '其他':
            category = '其他类型';
            break;
    }
    return category;
}