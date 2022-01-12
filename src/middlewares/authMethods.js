
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
const decodeToken = async (token, secretKey) => {
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
exports.decodeToken = decodeToken

//tạo token 
const generateToken = (payload, secretSignature, tokenLife) => {
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
exports.generateToken = generateToken

// xác nhận token
const verifyToken = async (token, secretKey) => {
	try
	{
		return await jwt.verify(token, secretKey)
	} catch (error)
	{
		console.log(`Error in verify access token:  + ${ error }`)
		return null
	}
}
exports.verifyToken = verifyToken

const identify = async (req, res, next) => {
	try
	{
		console.log(req._startTime, '_request: [' + req.method + ']' + req.originalUrl + ' \n start identify...')
		var thisMan
		//kiểm tra xem có access token hay không
		if (!req.cookies.ctrdata1) 
		{ // không có token, từ chối truy cập, báo lỗi
			console.log('_cảnh báo bảo mật: Từ chối 1 yêu cầu do không có token')
			return res.render('./site/notification', {
				direct: '/login',
				note: 'Status: 400<br/> _EAA01 <br/>Có lỗi sảy ra trong quá trình xác nhận danh tính hãy đăng nhập lại để đảm bảo an toàn', //không tìm thấy acess token
				buttonText: 'Đăng nhập',
			})
		}

		// có access token, giải mã để lấy dữ liệu
		const decoded = await decodeToken(
			req.cookies.ctrdata1,
			env.ACCESS_TOKEN_SECRET,
		)
		if (!decoded)
		{ // giải mã thất bại, từ chối truy cập, báo lỗi
			console.log('_cảnh báo bảo mật: không giải mã được token')
			return res.render('./site/notification', {
				direct: '/login',
				note: '_Status: 400<br/>_EAA02 <br/>Có lỗi sảy ra trong quá trình xác nhận danh tính hãy đăng nhập lại để đảm bảo an toàn',// không giải mã được acess token
				buttonText: 'Đăng nhập lại',
			})
		}
		// giải mã access token thành công, lấy dữ liệu và tiếp tục
		const id = decoded.payload.define

		// đối chiếu dữ liệu access token đã giải mã với DB
		Promise.all([
			accountsModel.findOne({_id: id}, {_id: 1}),
			tokensModel.findOne({userId: id}),
			identifyModel.findOne({userId: id}),
			basicProfileModel.findOne({userId: id}, {firstname: 1}),
			personSetting.findOne({userId: id}, {skin: 1})
		]).then(async ([user, rf, identified, basicProfile, theme]) => {
			if (!user || !rf) 
			{ // không có thông tin, từ chối truy cập và báo lỗi
				console.log('_cảnh báo bảo mật: không giải mã được token')
				return res.render('./site/notification', {
					direct: '/login',
					note: '_Status: 400<br/>_EAA03 <br/>Có lỗi sảy ra trong quá trình xác nhận danh tính hãy đăng nhập lại để đảm bảo an toàn',
					buttonText: 'Đăng nhập lại',
				})
			} else
			{ // có thông tin, tiếp tục đối chiếu refreshToken từ DB
				if (encoding(req.cookies.ctrdata2) == rf.refreshToken)
				{ // thông tin hợp lệ
					req.id = id // gán id người dùng vào biến request

					const verified = await verifyToken( //xác thực access token
						req.cookies.ctrdata1,
						env.ACCESS_TOKEN_SECRET,
					)

					if (!verified)
					{//trường hợp xác thực access token thất bại
						console.log('_Thông báo chekpoint: xác nhận Token thất bại kiểm tra an ninh dự phòng')
						var newAccessToken
						if (req.cookies.ctrdata1 == rf.lastToken) // so sánh với token đã lưu trong DB
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
								return res.render('./site/notification', {
									direct: '/login',
									note: '_Status: 400<br/>_EAA04 <br/>Có lỗi sảy ra trong quá trình xác nhận danh tính hãy đăng nhập lại để đảm bảo an toàn',
									buttonText: 'Đăng nhập lại',
								})
							}
							// tạo access token mới thành công tiếp tục bước sau
						} else
						{// khi access token không khớp, từ chối truy cập và báo lỗi
							return res.render('./site/notification', {
								direct: '/login',
								note: '_Status: 400<br/>_EAA04a <br/>Có lỗi sảy ra trong quá trình xác nhận danh tính hãy đăng nhập lại để đảm bảo an toàn',
								buttonText: 'Đăng nhập lại',
							})
						}
						// tạo access token mới thành công chuyển sang mildleware sau
						req.cookies.ctrdata1 = newAccessToken
						console.log(req._startTime, '_Thông báo chekpoint: xác nhận an ninh dự phòng thành công đã refresh token')
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
							firstname: basicProfile.firstname,
							middleName: basicProfile.middleName,
							familyName: basicProfile.familyName,
							skin: tskin,
						}
						req.whos = thisMan
						rf.lastToken = newAccessToken
						await tokensModel(rf).save()
						console.log(req._startTime, '_identify: finished, user info = ', req.whos)
						res.cookie('ctrdata1', newAccessToken, {maxAge: 2100000000})
						return next()
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
						firstname: basicProfile.firstname,
						middleName: basicProfile.middleName,
						familyName: basicProfile.familyName,
						skin: tskin,
					}
					req.whos = thisMan
					console.log(req._startTime, '_identify: finished, user info:\n ', req.whos)
					return next()
				} else
				{
					console.log('_Yêu cầu không hợp lệ: từ chối truy cập refresh token giả mạo')
					return res.render('./site/notification', {
						direct: '/login',
						note: '_Status: 402<br/>_EAA05 <br/>Có lỗi sảy ra trong quá trình xác nhận danh tính hãy đăng nhập lại để đảm bảo an toàn',
						buttonText: 'Đăng nhập lại',
					})
				}
			}
		})
	} catch (e)
	{
		console.log(e)
		return res.render('./site/notification', {
			direct: '/login',
			note: '_Status: 500<br/>_EAA06 <br/>Có lỗi sảy ra trong quá trình xác nhận danh tính hãy đăng nhập lại để đảm bảo an toàn',
			buttonText: 'Đăng nhập lại',
		})
	}
}

exports.identify = identify