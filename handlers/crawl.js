/*
 * @Author: zero
 * @Date: 2019-05-22 21:16:15
 * @LastEditors: zero
 * @LastEditTime: 2019-06-18 13:14:20
 * @Description: 爬取小说
 * @Responsibility: 
 */
const Novel = require('../models/novel.js')
const Chapter = require('../models/chapter.js')

const jsdom = require('jsdom')
const {
    JSDOM
} = jsdom; //解决html中文乱码问题

const Crawler = require("crawler")

exports.page = (req, res) => {
    res.render('crawler.html')
}

exports.novel = (req, response, next) => {
    let url = req.body.url || ''

    let c = new Crawler()
    c.queue([{
        uri: url,
        callback: async function (error, res, done) {
            if (error) {
                next(error)
            }

            try {
                let $ = res.$;
                let allATags = $('dd>a') //所有存放章节链接的a标签
                let bookUrl = '' //书的链接 http://www.shuquge.com/txt/95635/
                let articleUrl = '' //章节链接 http://www.shuquge.com/txt/95635/24316862.html
                let articleTitle = ''
                let dom = {}
                let novel = {}
                let article = {}

                novel.bookName = $('meta[property="og:novel:book_name"]').attr("content")
                novel.author = $('meta[property="og:novel:author"]').attr("content")
                novel.category = $('meta[property="og:novel:category"]').attr("content")
                novel.description = $('meta[property="og:description"]').attr("content").trim()
                novel.status = $('meta[property="og:novel:status"]').attr("content")
                let words = $('.small span:contains("字数")').text()
                novel.wordsNumber = Number.parseInt(words.substring(words.indexOf('：') + 1))
                novel.cover = $('meta[property="og:image"]').attr("content")
                novel.lastUpdateTime = $('meta[property="og:novel:update_time"]').attr("content")
                novel.latestChapter = $('meta[property="og:novel:latest_chapter_name"]').attr("content")
                novel.readUrl = $('meta[property="og:novel:read_url"]').attr("content")
                // 所有的章节数+12个重复的最新章节数
                novel.totalChapters = allATags.length

                // 保存小说基本信息
                let aNovel = await new Novel(novel).save()

                article.bookId = aNovel._id
                // 处理书的链接用于拼接文章内容的链接
                bookUrl = novel.readUrl.substring(0, novel.readUrl.lastIndexOf('/') + 1)

                // 跳过最新章节，从第一章开始爬
                for (let index = 12; index < allATags.length; index++) {
                    articleUrl = bookUrl + allATags[index].attribs.href
                    articleTitle = allATags[index].children[0].data

                    c.queue({
                        jQuery: false,
                        uri: articleUrl,
                        // retryTimeout: 1000,
                        articleTitle: articleTitle,
                        sort: index,
                        callback: async (err, res, done) => {
                            if (err) {
                                console.error(err.stack)
                            } else {
                                dom = new JSDOM(res.body);
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
            } catch (error) {
                next(error)
            }

            done();

            return response.status(200).json({
                status_code: 0,
                msg: 'OK',
                type: 'success',
                intro: '成功！',
                message: '开始爬取'
            })
        }
    }]);

}

exports.recentUpdate = (req, response, next) => {
    let url = req.body.url || ''

    let c = new Crawler()
    c.queue([{
        uri: url,
        callback: function (error, res, done) {
            if (error) {
                next(error)
            }
            let $ = res.$
            let list = $('.up>.l li .s2>a')
            for (let i = 0; i < list.length; i++) {
                let novelUrl = list[i].attribs.href
                c.queue([{
                    uri: novelUrl,
                    callback: async function (error, res, done) {
                        if (error) {
                            console.log(error);
                        }

                        try {
                            let $ = res.$;
                            let allATags = $('dd>a') //所有存放章节链接的a标签
                            let bookUrl = '' //书的链接 http://www.shuquge.com/txt/95635/
                            let articleUrl = '' //章节链接 http://www.shuquge.com/txt/95635/24316862.html
                            let articleTitle = ''
                            let dom = {}
                            let novel = {}
                            let article = {}
                            novel.bookName = $('meta[property="og:novel:book_name"]').attr("content")
                            novel.bookName = $('meta[property="og:novel:book_name"]').attr("content")
                            novel.author = $('meta[property="og:novel:author"]').attr("content")
                            novel.category = $('meta[property="og:novel:category"]').attr("content")
                            novel.description = $('meta[property="og:description"]').attr("content").trim()
                            novel.status = $('meta[property="og:novel:status"]').attr("content")
                            let words = $('.small span:contains("字数")').text()
                            novel.wordsNumber = Number.parseInt(words.substring(words.indexOf('：') + 1))
                            novel.cover = $('meta[property="og:image"]').attr("content")
                            novel.lastUpdateTime = $('meta[property="og:novel:update_time"]').attr("content")
                            novel.latestChapter = $('meta[property="og:novel:latest_chapter_name"]').attr("content")
                            novel.readUrl = $('meta[property="og:novel:read_url"]').attr("content")
                            // 所有的章节数+12个重复的最新章节数
                            novel.totalChapters = allATags.length

                            // 保存小说基本信息
                            let aNovel = await new Novel(novel).save()

                            article.bookId = aNovel._id
                            // 处理书的链接用于拼接文章内容的链接
                            bookUrl = novel.readUrl.substring(0, novel.readUrl.lastIndexOf('/') + 1)

                            // 跳过最新章节，从第一章开始爬
                            for (let index = 12; index < allATags.length; index++) {
                                articleUrl = bookUrl + allATags[index].attribs.href
                                articleTitle = allATags[index].children[0].data

                                c.queue({
                                    jQuery: false,
                                    uri: articleUrl,
                                    // retryTimeout: 1000,
                                    articleTitle: articleTitle,
                                    sort: index,
                                    callback: async (err, res, done) => {
                                        if (err) {
                                            console.error(err.stack)
                                        } else {
                                            dom = new JSDOM(res.body);
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
                        } catch (error) {
                            next(error)
                        }

                        done();

                        return response.status(200).json({
                            status_code: 0,
                            msg: 'OK',
                            type: 'success',
                            intro: '成功！',
                            message: '开始爬取'
                        })
                    }
                }])
            }
            done()
        }
    }])
}