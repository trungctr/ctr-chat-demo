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
const personSettingM = require('../../site/M/personSettings-model')



class AuthController {
	register = async (data) => {
		try
		{
			var reqUsername = data.username.toLowerCase();
			var reqPassword = data.password
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
				}

				var createAccount = await new accountsModel(newAccount).save()
				if (!createAccount)
				{
					return false
				} else
				{
					const userId = await accountsModel.findOne({username: reqUsername})
					const newidentifed = {
						username: userId.username,
						userId: userId._id,
					}
					const personSetting = {
						username: userId.username,
						userId: userId._id,
					}
					await identifyModel(newidentifed).save()
					await personSettingM(personSetting).save()
					return true
				}
			}
		} catch (e)
		{
			console.log('---------\n_Register:\n', e, '\n------------------')
			return false
		}
	}

	login = async (data) => {
		try
		{
			var reqUsername = data.username.toLowerCase()
			var reqPassword = data.password;
			const user = await accountsModel.findOne({username: reqUsername}, {username: 1, password: 1, createdAt: 1, updatedAt: 1})
			if (!user)
			{
				return {
					status: false,
					message: 'người dùng đã tồn tại'
				}
			}
			const isPasswordValid = bcrypt.compareSync(reqPassword, user.password);
			if (!isPasswordValid)
			{
				console.log('_Cảnh báo an ninh:', reqUsername, ' nhập sai mật khẩu')
				return {
					status: false,
					message: 'nhập sai tài khoản hoặc mật khẩu, hãy nhập lại'
				}
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
				console.log('tạo token thất bại')
				return {
					status: false,
					message: 'có sự cố khi đăng nhập, hãy thử lại'
				}
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
			console.log('đăng nhập thành công')
			return {
				status: true,
				ctrdata1: accessToken,
				ctrdata2: encoding(refreshToken),
			}
		} catch (e)
		{
			console.log('_At request = login,', e)
			return {
				status: false,
				message: 'có sự cố khi đăng nhập, hãy thử lại'
			}
		}
	}


	logout = async (req, res) => {
		res.clearCookie('ctrdata1')
		res.clearCookie('ctrdata2')
		res.redirect('back')
	}

	refreshToken = async (data) => {
		try
		{
			// Lấy access token từ cookie
			const reqAccessToken = data.ctrdata1
			if (!reqAccessToken)
			{
				console.log('không có token')
				return {
					status: false,
					message: 'có sự cố khi làm mới, hãy đăng nhập lại'
				}
			}
			// Lấy refresh token từ cookie
			const reqrefreshToken = encoding(data.ctrdata2)
			if (!reqrefreshToken)
			{
				console.log('không có refresh token')
				return {
					status: false,
					message: 'có sự cố khi làm mới, hãy đăng nhập lại'
				}
			}
			const accessTokenSecret = env.ACCESS_TOKEN_SECRET
			const accessTokenLife = env.ACCESS_TOKEN_LIFE

			// Decode access token
			const decoded = await authMethod.decodeToken(
				reqAccessToken,
				accessTokenSecret,
			)
			if (!decoded)
			{
				console.log('giải mã access token thất bại')
				return {
					status: false,
					message: 'có sự cố khi làm mới, hãy đăng nhập lại'
				}
			}

			const id = decoded.payload.define; // Lấy username từ payload
			var rf = await tokensModel.findOne({userId: id})
			const user = await accountsModel.findOne({_id: id}, {username: 1})
			if (!user)
			{
				console.log('_At request [GET] refreshtoken, ( _EAR03) cảnh báo bảo mật: người dùng không tồn tại !!')
				return {
					status: false,
					message: 'có sự cố khi làm mới, hãy đăng nhập lại'
				}
			}
			// kiểm tra reresh token trong cơ sở dữ liẹu
			if (reqrefreshToken !== rf.refreshToken)
			{
				console.log('refresh token không khớp với cơ sở dữ liệu')
				return {
					status: false,
					message: 'có sự cố khi làm mới, hãy đăng nhập lại'
				}
			}
			// Tạo access token mới
			const dataForAccessToken = {
				define: id
			}
			const accessToken = await authMethod.generateToken(
				dataForAccessToken,
				accessTokenSecret,
				accessTokenLife,
			)
			if (!accessToken)
			{
				console.log('tạo access token mới thất bại')
				return {
					status: false,
					message: 'có sự cố khi làm mới, hãy đăng nhập lại'
				}
			}

			rf.lastToken = accessToken
			await tokensModel(rf).save()
			//kết thúc và trả về access token mới
			return {
				status: true,
				value: accessToken
			}
		} catch (e)
		{
			console.log(e)
			return {
				status: false,
				message: 'có sự cố khi làm mới, hãy đăng nhập lại'
			}
		}
	}
}
module.exports = new AuthController()
