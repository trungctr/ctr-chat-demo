//socket methods
const auths = require('../../auth/C/auth-socket-controllers')
const users = require('../../auth/M/permissons-model')
const tokenModel = require('../../auth/M/refreshTokens-model')
const groupModel = require('../../site/M/chat-room-model')

class Socket {
	methods(io, socket) {
		console.log(socket.id, 'đã kết nối')
		var identify
		async function getrooms() {
			var allRooms = await groupModel.find({private: false})
			socket.emit('public', {allRooms})
		}
		async function getrooms() {
			var allRooms = await groupModel.find({private: false})
			socket.emit('public', {allRooms})
		}
		getrooms()

		//đăng ký
		socket.on('register', async function (data) {
			var reg = await auths.register(data)
			if (reg == true)
			{
				console.log(reg, 'đăng ký thành công')
				socket.emit('register', true)
			} else
			{
				console.log(reg, 'đăng ký thất bại')
				socket.emit('register', false)
			}
		})

		//đăng nhập
		socket.on('login', async (data) => {
			var login = await auths.login(data)
			socket.emit('login', login)
			if (login.status == true)
			{
				var find = await tokenModel.findOne({username: data.username}, {userId: 1})
				identify = {
					status: login.status,
					id: find.userId
				}
				var jointRooms = await groupModel.find({userIds: {$in: [identify.id]}})
				var dualPaired = await groupModel.find({userIds: {$in: [identify.id]}, dual: true})
				var yourRooms = await groupModel.find({createId: identify.id, adminId: identify.id, dual: false})
				socket.emit('jointRooms', jointRooms)
				socket.emit('dualPaired', dualPaired)
				socket.emit('yourRooms', yourRooms)
			}
		})

		socket.on('disconnect', () => {
			console.log(socket.id, 'ngắt kết nối')
		})


		// tạo group
		socket.on('add-group', async (data) => {
			console.log(data.groupName, typeof data.groupName)
			async function response(a) {
				var thisName = a.groupName
				var group = await groupModel.findOne({name: thisName})
				io.sockets.emit('add-group', {
					status: true,
					group
				})
				console.log(group)
			}

			if (identify.status == true)
			{
				var newGroup = {
					name: data.groupName,
					createId: identify.result.id,
					adminId: identify.result.id,
					userIds: [identify.result.id],
				}
				await groupModel(newGroup).save()
				await response(data)
				if (identify.value)
				{
					socket.emit('checkpoint', identify.value)
				}
			} else
			{
				socket.emit('add-group', {
					status: false,
					message: 'tạo group thất bại'
				})
			}
		})

		socket.on('dual-chat', async (d) => {
			console.log(socket.id, d.name, ':', d.message)
			// gửi dữ liệu nhận được cho toàn bộ clients
			var toAll = d
			toAll.message = 'to all' + toAll.message
			io.sockets.emit('dual-chat', toAll)

			// chỉ trả lời cho duy nhất client đã gửi
			var d2 = {}
			d2.name = 'Server'
			d2.message = 'you said "' + d.message + '"(only you see this)'
			socket.emit('dual-chat', d2)

			// trả lời cho tất cả clients trừ client đã gửi
			var d3 = {}
			d3.name = 'Server'
			d3.message = '(' + d.name + ')' + d.message
			socket.broadcast.emit('dual-chat', d3)

			// lấy danh sách các room
			console.log(socket.adapter.rooms)

		})
		// join room, khi join vào 1 room chưa tồn tại thì sokect sẽ tạo 1 room mới
		// khi join vào 1 room đã tồn tại thì sẽ đc join vào room tồn tại
		socket.on('join room', (d) => {
			socket.join(d)
		})

		// join room, khi join vào 1 room chưa tồn tại thì sokect sẽ tạo 1 room mới
		// khi join vào 1 room đã tồn tại thì sẽ đc join vào room tồn tại
		socket.on('leave room', (d) => {
			socket.leave(d)
		})

	}
}

module.exports = new Socket()