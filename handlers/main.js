/*
 * @Author: zero
 * @Date: 2019-05-12 13:35:50
 * @LastEditors: zero
 * @LastEditTime: 2019-06-17 17:44:19
 * @Description: 首页、登录、注册、退出
 * @Responsibility: 
 */
const fortune = require('../lib/fortune');
const User = require('../models/user.js')
const md5 = require('blueimp-md5')
const credentials = require('../credentials.js')
const validator = require('validator');

const VALID_PASSWORD_REGEX = /^[a-zA-Z][\w@\.]{5,17}$/
const VALID_NICKNAME_REGEX = /^[\w\u4e00-\u9fa5@]{2,8}$/

exports.about = (req, res) => {
	res.render('about.html', {
		fortune: fortune.getFortune(),
		pageTestScript: '/qa/tests-about.js' //指定页面测试文件
	});
};

exports.login = (req, res) => {
	res.render('login.html');
};

exports.loginHandle = async (req, res, next) => {
	let body = req.body
	let userName = body.userName || '',
		password = body.password || '',
		rememberVal = body.rememberVal || ''

	try {
		let user = await User.findOne({
			$or: [{
					email: userName
				},
				{
					nickName: userName
				}
			],
			password: md5(md5(password) + credentials.passwordStr)
		})

		if (!user) {
			req.session.flash = {
				message: '用户名或者密码不正确'
			}
			req.session.form = {
				user: {
					userName: userName
				}
			}
			return res.redirect('/login')
		}

		// 是否勾选记住我
		if (rememberVal) {
			req.session.user = user
		} else {
			req.session.no_remember = user
		}

		res.redirect('/')
	} catch (error) {
		next(error)
	}
}

exports.register = (req, res) => {
	res.render('register.html');
};

exports.registerHandle = async (req, res, next) => {
	let body = req.body
	let email = body.email || '',
		password = body.password || '',
		nickName = body.nickName || ''

	let err_pattern = '';
	if (!validator.isEmail(email)) {
		err_pattern = '请输入正确的邮箱地址'
	} else if (!validator.matches(nickName, VALID_NICKNAME_REGEX)) {
		err_pattern = '昵称格式非法,不能包含特殊字符，长度在2~8之间'
	} else if (!validator.matches(password, VALID_PASSWORD_REGEX)) {
		err_pattern = '密码格式非法,只能以字母开头，长度在6~18之间，可以包含字符、数字、下划线、@和.'
	}

	if (err_pattern !== '') {
		req.session.flash = {
			message: err_pattern
		}
		req.session.form = {
			user: {
				email: email,
				nickName: nickName
			}
		}
		return res.redirect('/register')
	}

	try {
		//并发执行这两个方法 
		let [isExistEmail, isExistNickName] = await Promise.all([await User.findOne({
			email: email
		}), await User.findOne({
			nickName: nickName
		})]);

		if (isExistEmail) {
			req.session.flash = {
				message: '邮箱已存在'
			}

			req.session.form = {
				user: {
					email: email,
					nickName: nickName,
					password: password,
				}
			}

			return res.redirect('/register');
		}

		if (isExistNickName) {
			req.session.flash = {
				message: '昵称已存在'
			}

			req.session.form = {
				user: {
					email: email,
					nickName: nickName,
					password: password,
				}
			}

			return res.redirect('/register');
		}

		body.password = md5(md5(body.password) + credentials.passwordStr)

		let user = await new User(body).save()

		// 使用session记录用户的登录状态
		req.session.user = user

		return res.redirect('/');
	} catch (error) {
		next(error)
	}
}

exports.logoutHandle = (req, res) => {
	req.session.user = null
	res.redirect('/login')
}