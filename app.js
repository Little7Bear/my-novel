const express = require('express')
const path = require('path')
const fs = require('fs')
const http = require('http')
const bodyParser = require('body-parser')
const session = require('express-session')
const RedisStore = require('connect-redis')(session) //缓存保存session
const credentials = require('./credentials.js') //存放私人秘钥
const template = require('express-art-template')
const StaticMap = require('./lib/static.js')
const paginate = require('express-paginate');

const router = require('./router')

const app = express()
app.set('port', process.env.PORT || 3000)

let server;

//使用域捕获未能处理的错误中间件
app.use((req, res, next) => {
    var domain = require('domain').create();
    domain.on('error', function (err) {
        console.error('DOMAIN ERROR CAUGHT\n', err.stack);
        try {
            // 在5 秒内进行故障保护关机
            setTimeout(function () {
                console.error('Failsafe shutdown.');
                process.exit(1);
            }, 5000);

            // 从集群中断开
            let worker = require('cluster').worker;
            if (worker) worker.disconnect();

            // 停止接收新请求
            server.close();

            try {
                // 尝试使用Express 错误路由
                next(err);
            } catch (error) {
                // 如果Express 错误路由失效，尝试返回普通文本响应
                console.error('Express error mechanism failed.\n', error.stack);
                res.statusCode = 500;
                res.setHeader('content-type', 'text/plain');
                res.end('Server error.');
            }
        } catch (error) {
            console.error('Unable to send 500 response.\n', error.stack);
        }
    });

    // 向域中添加请求和响应对象
    domain.add(req);
    domain.add(res);

    // 执行该域中剩余的请求链
    domain.run(next);
});

// 日志
switch (app.get('env')) {
    case 'development':
        // 紧凑的、彩色的开发日志
        app.use(require('morgan')('dev'));
        break;
    case 'production':
        // 支持按日志循环,每24 小时复制一次，然后开始新的日志，防止日志文件无限制地增长
        app.use(require('express-logger')({
            path: __dirname + '/log/requests.log'
        }));
        break;
}

// 视图引擎
app.set('views', path.join(__dirname, './views/'))
app.engine('html', template)
app.set('view options', {
    debug: process.env.NODE_ENV !== 'production',
    escape: true, //防范 XSS 攻击
    imports: { //导入的模板变量
        //映射静态资源的方法
        staticMap: name => {
            return StaticMap.map(name);
        }
    }
});


// 解析post请求中间件
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json())

// 静态资源中间件
app.use(express.static(path.join(__dirname, 'public')))

// 数据库配置
const mongoose = require('mongoose')
mongoose.set('bufferCommands', false) //禁用缓冲,未连接数据库时不能使用schema
switch (app.get('env')) {
    case 'development':
        mongoose.connect(credentials.mongo.development.connectionString, {
            useNewUrlParser: true,
            useCreateIndex: true,
            poolSize: 10,
            family: 4
        }).catch(err => {
            console.error('database connetion error--' + err);
        })
        break;
    case 'production':
        mongoose.connect(credentials.mongo.production.connectionString, {
            useNewUrlParser: true,
            useCreateIndex: true,
            poolSize: 10,
            family: 4,
            autoIndex: false
        }).catch(err => {
            console.error('database connetion error--' + err);
        })
        break;
    default:
        throw new Error('Unknown execution environment: ' + app.get('env'));
}

// redis中间件
app.use(require('express-redis')())

// 页面测试中间件，如果querystring包含test=1，设置'showTests'上下文属性
app.use(function (req, res, next) {
    res.locals.showTests = app.get('env') !== 'production' &&
        req.query.test === '1';
    next();
})

//存储session中间件
switch (app.get('env')) {
    case 'development':
        app.use(session({
            secret: credentials.sessionSecret,
            resave: false,
            saveUninitialized: true,
        }));
        break;
    case 'production':
        app.use(session({
            secret: credentials.sessionSecret,
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 15
            },
            resave: false,
            saveUninitialized: true,
            store: new RedisStore({
                logErrors: true,
            })
        }))
        // 处理断开连接
        app.use((req, res, next) => {
            if (!req.session) {
                return next(new Error('session not ready'))
            }
            next()
        })
        break;
}

//session处理中间件
app.use(function (req, res, next) {
    res.locals.flash = req.session.flash;
    res.locals.form = req.session.form;
    res.locals.user = req.session.no_remember;

    delete req.session.flash;
    delete req.session.form;
    delete req.session.no_remember;
    next();
});

// 限制分页返回的结果数量和最大结果数量
app.use(paginate.middleware(10, 20))

// 防止跨站请求伪造
// app.use(require('csurf')());
// app.use((req, res, next) => {
//     res.locals._csrfToken = req.csrfToken();
//     next();
// });

// 路由 
app.use(router)

// 自动渲染视图,在views下添加一个html页面不需渲染即可通过浏览器访问
let autoViews = {};
app.use((req, res, next) => {
    let path = req.path.toLowerCase() + '.html';
    if (autoViews[path]) return res.render(autoViews[path]);
    if (fs.existsSync(__dirname + '/views' + path)) {
        autoViews[path] = path.replace(/^\//, '');
        return res.render(autoViews[path]);
    }
    next()
})

// 404处理
app.use((req, res) => {
    res.status(404).render('404.html')
})

// 统一错误处理器,必须放在app.use(router)后面,注意这里的四个参数是必须的
app.use((err, req, res, next) => {
    console.error(err.stack)
    return res.status(500).json({
        err_code: 500,
        msg: 'Internal error'
    })
})

function startServer() {
    server = http.createServer(app).listen(app.get('port'), () => {
        console.log('Express started in ' + app.get('env') +
            ' mode on http://localhost:' + app.get('port') +
            ' press Ctrl-C to terminate.');
    });
}

// 应用集群扩展
if (require.main === module) {
    // 应用程序直接运行；启动应用服务器
    startServer();
} else {
    // 应用程序作为一个模块通过"require" 引入: 导出函数
    module.exports = startServer;
}