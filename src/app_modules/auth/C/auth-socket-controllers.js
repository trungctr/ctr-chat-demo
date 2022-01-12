const randToken = require('rand-token');
const bcrypt = require('bcryptjs');

const env = require('../../../config/variables/env')//import các biến môi trường

const {mongooseToOject} = require('../../../util/mongoose');
const {mutilMongooseToOject} = require('../../../util/mongoose');
const {encoding} = require('../../../util/encodeToken');

var authMethod = require('../../../middlewares/authMethods');

const accountsModel = require('../M/accounts-model');
const tokensModel = require('../M/refreshTokens-model');
const identifyModel = require('../M/identify-model');



class AuthController {
	register = async (req) => {
		try
		{
			var reqUsername = req.body.username.toLowerCase();
			var reqPassword = req.body.password
			const user = await accountsModel.find({username: reqUsername}, {username: 1})
			if (user.length > 0)
			{
				return false
			}
			else
			{
				const hashPassword = bcrypt.hashSync(reqPassword, Number(env.SALT_ROUNDS));
				const newAccount = {
					username: reqUsername,
					password: hashPassword,
				};

				var createAccount = await new accountsModel(newAccount).save()
				if (!createAccount)
				{
					return res.render('./site/notification', {
						direct: '/register',
						note: '_Status: 400<br/> _EAS01 <br/>Gặp lỗi trong quá trình tạo tài khoản',
						buttonText: 'Tạo lại',
					})
				} else
				{
					const userId = await accountsModel.findOne({username: reqUsername})
					const newidentifed = {
						username: userId.username,
						userId: userId._id,
					}
					await identifyModel(newidentifed).save()
					return true
				}
			}
		} catch (e)
		{
			console.log('---------\n_Register:\n', e, '\n------------------')
			return false
		}
	}

	authLogin = async (req, res) => {
		try
		{
			var reqUsername = req.body.username.toLowerCase()
			var reqPassword = req.body.password;
			const user = await accountsModel.findOne({username: reqUsername}, {username: 1, password: 1, createdAt: 1, updatedAt: 1})
			if (!user)
			{
				return res.render('./site/notification', {
					direct: '/login',
					note: '_Status: 401<br/> _EAL01 <br/>Tài khoản hoặc mật khẩu không chính xác',// tài khoản không tồn tại
					buttonText: 'Nhập lại',
				})
			}
			const isPasswordValid = bcrypt.compareSync(reqPassword, user.password);
			if (!isPasswordValid)
			{
				console.log('_Cảnh báo an ninh:', reqUsername, ' nhập sai mật khẩu')
				return res.render('./site/notification', {
					direct: '/login',
					note: '_Status: 401<br/> _EAL02 <br/>Tài khoản hoặc mật khẩu không chính xác',// sai mật khẩu
					buttonText: 'Nhập lại',
				})
			}
			const accessTokenLife = env.ACCESS_TOKEN_LIFE
			const accessTokenSecret = env.ACCESS_TOKEN_SECRET
			const dataForAccessToken = {
				define: user._id,
			};
			const accessToken = await authMethod.generateToken(
				dataForAccessToken,
				accessTokenSecret,
				accessTokenLife,
			);
			if (!accessToken)
			{
				return res.render('./site/notification', {
					direct: '/login',
					note: '_Status: 501<br/> _EAL03 <br/>Gặp lỗi trong quá trình đăng nhập',//Tạo access token thất bại
					buttonText: 'Đăng nhập lại',
				})
			}
			var refreshToken
			// kiểm tra xem đã có refresh token trong DB chưa ?
			var DBrefreshToken = await tokensModel.findOne({userId: user._id});
			// Nếu user này chưa có refresh token thì là lần đầu đăng nhập tạo 1 refresh token và lưu vào database
			if (!DBrefreshToken)
			{
				refreshToken = await randToken.generate(env.REFRESH_TOKEN_SIZE);// tạo 1 refresh token ngẫu nhiên trong lần đầu đăng nhập
				const newToken = {
					username: reqUsername,
					lastToken: accessToken,
					refreshToken: refreshToken,
					userId: user._id
				}
				await tokensModel(newToken).save()
			} else
			{
				// Nếu user này đã có refresh token thì lấy refresh token đó từ database
				refreshToken = DBrefreshToken.refreshToken;
				DBrefreshToken.lastToken = accessToken
				new tokensModel(DBrefreshToken).save()
			}
			res.cookie('ctrdata1', accessToken, {maxAge: 2100000000})
			res.cookie('ctrdata2', encoding(refreshToken), {maxAge: 2100000000})
			res.render('./site/notification', {
				direct: '/projects/manager',
				note: 'Status: 201<br/>Đăng nhập thành công',
				buttonText: 'OK',
			})

		} catch (e)
		{
			console.log('_At request = login,', e)
			return res.render('./site/notification', {
				direct: '/login',
				note: '_Status: 501<br/> _EAL04 <br/>Gặp lỗi trong quá trình đăng nhập',//Tạo access token thất bại
				buttonText: 'Đăng nhập lại',
			})
		}
	};


	authLogout = async (req, res) => {
		res.clearCookie('ctrdata1');
		res.clearCookie('ctrdata2');
		res.render('./site/notification', {
			direct: '/',
			note: '_Status: 200 <br/>Đăng xuất thành công',
			buttonText: 'OK',
		})
	}

	refreshToken = async (req, res, next) => {
		try
		{
			// Lấy access token từ cookie
			const reqaccessToken = req.cookies.ctrdata1
			if (!reqaccessToken)
			{
				return res.render('./site/notification', {
					direct: '/login',
					note: '_Status: 400 <br/> _EAR01 <br/> Có lỗi sảy ra trong quá trình xác nhận danh tính hãy đăng nhập lại để đảm bảo an toàn',//không tìm thấy acess token
					buttonText: 'Đăng nhập lại',
				})
			}
			// Lấy refresh token từ cookie
			const reqrefreshToken = encoding(req.cookies.ctrdata2)
			if (!reqrefreshToken)
			{
				return res.render('./site/notification', {
					direct: '/login',
					note: '_Status: 400<br/> _EAR02 <br/> lỗi sảy ra trong quá trình xác nhận danh tính hãy đăng nhập lại để đảm bảo an toàn',//không tìm thấy refesh token
					buttonText: 'Đăng nhập lại',
				})
			}
			const accessTokenSecret = env.ACCESS_TOKEN_SECRET
			const accessTokenLife = env.ACCESS_TOKEN_LIFE

			// Decode access token
			const decoded = await authMethod.decodeToken(
				reqaccessToken,
				accessTokenSecret,
			)
			if (!decoded)
			{
				return res.render('./site/notification', {
					direct: '/login',
					note: '_Status: 400<br/> _EAR02 <br/>Có lỗi sảy ra trong quá trình xác nhận danh tính hãy đăng nhập lại để đảm bảo an toàn',// không giải mã được acess token
					buttonText: 'Đăng nhập lại',
				})
			}
			const id = decoded.payload.define; // Lấy username từ payload
			var rf = await tokensModel.findOne({userId: id})
			const user = await accountsModel.findOne({_id: id}, {username: 1})
			if (!user)
			{
				console.log('_At request [GET] refreshtoken, ( _EAR03) cảnh báo bảo mật: người dùng không tồn tại !!')
				return res.render('./site/notification', {
					direct: '/login',
					note: '_Status: 401<br/> _EAR03 <br/>Lỗi 103, hãy đăng nhập lại. Nếu lỗi này vẫn lặp lại hãy liên hệ với quản trị viên!',// không giải mã được acess token
					buttonText: 'Đăng nhập lại',
				})
			}
			// kiểm tra reresh token trong cơ sở dữ liẹu
			if (reqrefreshToken !== rf.refreshToken)
			{
				return res.render('./site/notification', {
					direct: '/login',
					note: '_Status: 400 <br/> _EAR04 <br/> Có lỗi sảy ra trong quá trình xác nhận danh tính hãy đăng nhập lại để đảm bảo an toàn', // refresh token
					buttonText: 'Đăng nhập lại',
				})
			}
			// Tạo access token mới
			const dataForAccessToken = {
				define: id
			};
			const accessToken = await authMethod.generateToken(
				dataForAccessToken,
				accessTokenSecret,
				accessTokenLife,
			);
			if (!accessToken)
			{
				return res.render('./site/notification', {
					direct: '/login',
					note: '_Status: 400<br/> _EAR05 <br/>Có lỗi sảy ra trong quá trình xác nhận danh tính hãy đăng nhập lại để đảm bảo an toàn', //refresh token
					buttonText: 'Đăng nhập lại',
				})
			}
			rf.lastToken = accessToken
			await tokensModel(rf).save()
			//kết thúc và trả về access token mới
			await res.json(accessToken)
		} catch (e)
		{
			console.log(e)
			return res.render('./site/notification', {
				direct: '/login',
				note: '_Status: 500<br/> _EAR06 <br/>Server gặp lỗi trong quá trình xác nhận danh tính hãy đăng nhập lại để đảm bảo an toàn', //lỗi máy chủ
				buttonText: 'Đăng nhập lại',
			})
		}
	}
}
module.exports = new AuthController()
