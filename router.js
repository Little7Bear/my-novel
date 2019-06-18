const express = require('express')
const router = express.Router()
const main = require('./handlers/main.js')
const crawl = require('./handlers/crawl.js')
const book = require('./handlers/book.js')
const chapter = require('./handlers/chapter.js')

//爬虫
router.get('/crawler', crawl.page)
router.post('/crawler', crawl.novel)
router.post('/crawler/recent-update', crawl.recentUpdate)

// 登录注册
router.get('/login', main.login)
router.post('/login', main.loginHandle)
router.get('/register', main.register)
router.post('/register', main.registerHandle)
router.get('/logout', main.logoutHandle)

//小说
router.get('/', book.page)
router.post('/book', book.getMore)
router.post('/book/update', book.update)
router.get('/book/del', book.del)
router.get('/book/getNovelByCategory', book.categoryNovel)
router.post('/book/search', book.search)

// 章节
router.get('/chapter/:bookId', chapter.get)
router.post('/chapter/:bookId', chapter.post)
router.get('/chapter/catalog/:bookId', chapter.catalog)

module.exports = router