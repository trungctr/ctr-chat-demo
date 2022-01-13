
const jwt = require('jsonwebtoken')
const accountsModel = require('../app_modules/auth/M/accounts-model')
const identifyModel = require('../app_modules/auth/M/identify-model')
const tokensModel = require('../app_modules/auth/M/refreshTokens-model')
const personSetting = require('../app_modules/site/M/personSettings-model')

const {mongooseToOject} = require('../util/mongoose')
const {mutilMongooseToOject} = require('../util/mongoose')
const {encoding} = require('../util/encodeToken')
const env = require('../config/variables/env')//import các biến môi trường

//giải mã token
var decodeToken = async (token, secretKey) => {
	try
	{
		return jwt.verify(token, secretKey, {
			ignoreExpiration: true,
		})
	} catch (error)
	{
		console.log(`Error in decode access token: ${ error }`)
		return null
	}
}

//tạo token 
var generateToken = (payload, secretSignature, tokenLife) => {
	try
	{
		return jwt.sign(
			{
				payload,
			},
			secretSignature,
			{
				algorithm: 'HS256',
				expiresIn: tokenLife,
			},
		)
	} catch (error)
	{
		console.log(`Error in generate access token:  + ${ error }`)
		return null
	}
}

// xác nhận token
var verifyToken = async (token, secretKey) => {
	try
	{
		return await jwt.verify(token, secretKey)
	} catch (error)
	{
		console.log(`Error in verify access token:  + ${ error }`)
		return null
	}
}
class AuthMethods {
	decodeToken = async (token, secretKey) => {
		try
		{
			return jwt.verify(token, secretKey, {
				ignoreExpiration: true,
			})
		} catch (error)
		{
			console.log(`Error in decode access token: ${ error }`)
			return null
		}
	}

	generateToken = (payload, secretSignature, tokenLife) => {
		try
		{
			return jwt.sign(
				{
					payload,
				},
				secretSignature,
				{
					algorithm: 'HS256',
					expiresIn: tokenLife,
				},
			)
		} catch (error)
		{
			console.log(`Error in generate access token:  + ${ error }`)
			return null
		}
	}

	verifyToken = async (token, secretKey) => {
		try
		{
			return await jwt.verify(token, secretKey)
		} catch (error)
		{
			console.log(`Error in verify access token:  + ${ error }`)
			return null
		}
	}


	identify = async (data) => {
		try
		{
			console.log('_identify: start ...')
			var thisMan
			//kiểm tra xem có access token hay không
			if (!data.ctrdata1) 
			{ // không có token, từ chối truy cập, báo lỗi
				console.log('_identify: cảnh báo bảo mật! Từ chối 1 yêu cầu do không có token')
				return {
					status: false,
					message: 'Có sự cố khi xác nhận danh tính, Hãy đăng nhập lại để đảm bảo an ninh'
				}
			}

			// có access token, giải mã để lấy dữ liệu
			const decoded = await decodeToken(
				data.ctrdata1,
				env.ACCESS_TOKEN_SECRET,
			)
			if (!decoded)
			{ // giải mã thất bại, từ chối truy cập, báo lỗi
				console.log('__identify: cảnh báo bảo mật! không giải mã được token')
				return {
					status: false,
					message: 'Có sự cố khi xác nhận danh tính, Hãy đăng nhập lại để đảm bảo an ninh'
				}
			}
			// giải mã access token thành công, lấy dữ liệu và tiếp tục
			const id = decoded.payload.define

			// đối chiếu dữ liệu access token đã giải mã với DB
			var user = await accountsModel.findOne({_id: id}, {_id: 1})
			var rf = await tokensModel.findOne({userId: id})
			var identified = await identifyModel.findOne({userId: id})
			var theme = await personSetting.findOne({userId: id}, {skin: 1})
			if (!user || !rf) 
			{ // không có thông tin, từ chối truy cập và báo lỗi
				console.log('_identify: cảnh báo bảo mật! không tìm thông tin người dùng')
				return {
					status: false,
					message: 'Có sự cố khi xác nhận danh tính, Hãy đăng nhập lại để đảm bảo an ninh'
				}
			} else
			{ // có thông tin, tiếp tục đối chiếu refreshToken từ DB
				if (encoding(data.ctrdata2) == rf.refreshToken)
				{ // thông tin hợp lệ

					const verified = await verifyToken( //xác thực access token
						data.ctrdata1,
						env.ACCESS_TOKEN_SECRET,
					)

					if (!verified)
					{//trường hợp xác thực access token thất bại
						console.log('_identify: cảnh báo bảo mật! xác nhận Token thất bại kiểm tra an ninh dự phòng')
						var newAccessToken
						if (data.ctrdata1 == rf.lastToken) // so sánh với token đã lưu trong DB
						{
							// khi access token khớp, tạo access token mới
							const dataForAccessToken = {
								define: id
							}
							newAccessToken = await generateToken(
								dataForAccessToken,
								env.ACCESS_TOKEN_SECRET,
								env.ACCESS_TOKEN_LIFE,
							)
							if (!newAccessToken)
							{ // tạo thất bại từ chối truy cập và báo lỗi
								console.log('_identify: cảnh báo bảo mật! tạo access token mới thất bại')
								return {
									status: false,
									message: 'Có sự cố khi xác nhận danh tính, Hãy đăng nhập lại để đảm bảo an ninh'
								}
							}
							// tạo access token mới thành công tiếp tục bước sau
						} else
						{// khi access token không khớp, từ chối truy cập và báo lỗi
							console.log('_identify: cảnh báo bảo mật! access token không đúng')
							return {
								status: false,
								message: 'Có sự cố khi xác nhận danh tính, Hãy đăng nhập lại để đảm bảo an ninh'
							}
						}
						// tạo access token mới thành công chuyển sang mildleware sau
						data.ctrdata1 = newAccessToken
						console.log('_identify: xác nhận an ninh dự phòng thành công đã refresh token')
						//trả kết quả thông tin người dùng
						var tskin
						if (theme == null)
						{
							tskin = 'default.css'
						} else
						{
							tskin = theme.skin
						}
						thisMan = {
							id: identified.userId,
							rank: identified.rankId,
							dept: identified.unitId,
							deptMajor: identified.majorId,
							accessLevel: identified.accessLevel,
							skin: tskin,
						}
						rf.lastToken = newAccessToken
						await tokensModel(rf).save()
						console.log('_identify: finished, user info:\n ', thisMan)
						return {
							status: true,
							value: newAccessToken,
							result: thisMan,
						}

					}
					//xác nhận token thành công chuyển sang mildleware sau
					var tskin
					if (theme == null)
					{
						tskin = 'default.css'
					} else
					{
						tskin = theme.skin
					}
					thisMan = {
						id: identified.userId,
						rank: identified.rankId,
						dept: identified.unitId,
						deptMajor: identified.majorId,
						accessLevel: identified.accessLevel,
						skin: tskin,
					}
					console.log('_identify: finished, user info:\n ', thisMan)
					return {
						status: true,
						result: thisMan,
					}
				} else
				{
					console.log('_identify: cảnh báo bảo mật! từ chối truy cập refresh token giả mạo')
					return {
						status: false,
						message: 'Có sự cố khi xác nhận danh tính, Hãy đăng nhập lại để đảm bảo an ninh'
					}
				}
			}
		} catch (e)
		{
			console.log('_identify: error\n', e, '\n-----------------------------')
			return {
				status: false,
				message: 'Có sự cố khi xác nhận danh tính, Hãy đăng nhập lại để đảm bảo an ninh'
			}
		}
	}
}
module.exports = new AuthMethods()