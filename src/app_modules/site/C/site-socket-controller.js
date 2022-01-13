//socket methods
const auths = require('../../auth/C/auth-socket-controllers')
const groupModel = require('../../site/M/chat-room-model')
const personSettingM = require('../M/personSettings-model')
const socketIdModel = require('../../auth/M/socketId-model')

class Socket {
	methods(io, socket) {
		//public
		console.log(socket.id, 'đã kết nối')
		async function publicRooms() {
			var allRooms = await groupModel.find({private: false})
			socket.emit('public', {allRooms})
		}
		async function publicUsers() {
			var allUsers = await personSettingM.aggregate([
				{
					$lookup: {
						from: "socketids",
						localField: "userId",
						foreignField: "userId",
						as: "tempId"
					}
				}, {
					$match: {
						online: true,
					}
				}, {
					$project: {
						_id: 0,
						username: 1,
						userId: 1,
						tempId: 1,
					}
				}
			])
			socket.emit('publicUser', allUsers)
		}
		publicRooms()

		//register
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

		//login
		socket.on('login', async (data) => {
			var login = await auths.login(data)
			if (login.status == true)
			{
				socket.emit('login', login)
				var find = await personSettingM.findOne({username: data.username})
				const id = find.userId
				await socketIdModel.updateOne({userId: id}, {userId: id, socketId: socket.id}, {upsert: true})
				socket.myId = id
				var jointRooms = await groupModel.find({userIds: {$in: [id]}})
				var dualPaired = await groupModel.find({userIds: {$in: [id]}, dual: true})
				var yourRooms = await groupModel.find({createId: id, adminId: id, dual: false})
				await personSettingM.updateOne({userId: id}, {online: true})
				socket.emit('jointRooms', jointRooms)
				socket.emit('dualPaired', dualPaired)
				socket.emit('yourRooms', yourRooms)
				if (find.hidden)
				{
					await publicUsers()
				} else
				{
					socket.broadcast.emit('ping', {
						username: find.username,
						userId: id,
						tempId: [{socketId: socket.id}]
					})
					await publicUsers()
				}
			} else
			{
				socket.emit('login', login)
			}
		})

		//logout
		socket.on('logout', async (d) => {
			const id = d
			await personSettingM.updateOne({userId: id}, {online: false})
			io.sockets.emit('offline', id)
			console.log(socket.id, 'đăng xuất')
		})

		//offline
		socket.on('disconnect', async () => {
			const id = socket.myId
			await personSettingM.updateOne({userId: id}, {online: false})
			io.sockets.emit('offline', id)
			console.log(socket.id, 'ngắt kết nối')
		})


		//create room
		socket.on('add-group', async (data) => {
			const newGroup = {
				name: data.groupName,
				createId: data.ime.userId,
				adminId: data.ime.userId,
				userIds: [data.ime.userId],
			}
			await groupModel(newGroup).save()
			var createdGroup = await groupModel.findOne({name: newGroup.name})
			if (createdGroup)
			{
				io.sockets.emit('add-group', createdGroup)
				socket.emit('yourRooms', createdGroup)
				socket.emit('jointRooms', createdGroup)
			} else
			{
				socket.emit('add-group', false)
			}
		})

		//delete room
		socket.on('removeGroup', async (data) => {
			await groupModel.deleteOne({_id: data})
			var deletedGroup = await groupModel.findOne({_id: data})
			if (deletedGroup)
			{
				socket.emit('removeGroup', false)
			} else
			{
				io.sockets.emit('removeGroup', data)
			}
		})


		//dual chat editing***
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