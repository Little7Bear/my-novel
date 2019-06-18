# 主题
   一个爬取书趣阁的小说到本地浏览的网站
## 项目目录
---
| 路径           |            功能             |     备注     |
|----------------|:---------------------------:|:------------:|
| app.js         |                             |   入口文件   |
| app_cluster.js | 利用CPU多核，启动多个服务器 | 多核入口文件 |
| router.js      |   分配用户请求到handlers    |     路由     |
| handlers       | 处理路由传递过来的用户请求  |              |
| lib            |                             |   公共方法   |
| public         |                             |   静态文件   |
| public/vendor  |    页面中用到的第三方库     |              |
| credentials.js |          存放私钥           |              |

## 启动命令
---
- `node .\app.js` 

## 路由
---
```
  代码...
  代码...
  代码...
```

## 使用手册
---
- [爬取网址]( http://www.shuquge.com/)
- 例 http://www.shuquge.com/txt/74671/index.html