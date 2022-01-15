//socket methods
const auths = require('../../auth/C/auth-socket-controllers')
const groupModel = require('../../site/M/chat-room-model')
const messageModel = require('../M/message-model')
const personSettingM = require('../M/personSettings-model')
const SocketId = require('../M/soketId-model')


class Socket {
	methods(io, socket) {
		//public
		console.log(socket.id, 'đã kết nối')
		console.log(1, io.sockets.adapter.rooms, '\n')
		socket.emit('connected', socket.id)
		async function publicRooms() {
			var allRooms = await groupModel.find({private: false})
			socket.emit('public', {allRooms})
		}
		async function publicUsers() {
			var allUsers = await personSettingM.find({online: true, hidden: false}, {userId: 1, username: 1})
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
				const find = await personSettingM.findOne({username: data.username}, {userId: 1, username: 1, hidden: 1})
				const id = find.userId
				const nowSocket = socket.id
				console.log('nowSocket=', nowSocket)
				await SocketId.updateOne({userId: id}, {userId: id, value: nowSocket}, {upsert: true})
				login.id = id
				login.username = data.username
				login.socketId = nowSocket
				socket.emit('login', login)
				console.log(1, io.sockets.adapter.rooms, '\n')
				await personSettingM.updateOne({userId: id}, {online: true})
				socket.myId = id
				if (find.hidden)
				{
					await publicUsers()
				} else
				{
					socket.broadcast.emit('ping', {
						username: find.username,
						userId: id,
					})
					await publicUsers()
				}
				var jointRooms = await groupModel.find({userIds: {$in: [id]}, dual: false})
				var dualPaired = await groupModel.find({userIds: {$in: [id]}, dual: true})
				var yourRooms = await groupModel.find({createId: id, adminId: id, dual: false})
				socket.emit('jointRooms', jointRooms)
				socket.emit('dualPaired', dualPaired)
				socket.emit('yourRooms', yourRooms)
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
				adminIds: [data.ime.userId],
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
		socket.on('removeGroup', async (groupId) => {
			await groupModel.deleteOne({_id: groupId})
			var deletedGroup = await groupModel.findOne({_id: groupId})
			if (deletedGroup)
			{
				socket.emit('removeGroup', false)
			} else
			{
				io.sockets.emit('removeGroup', groupId)
			}
		})

		//pairing - dual chat
		socket.on('pairing', async (ids) => {
			try
			{
				//kiểm tra pair hay chưa ?
				var dual = ids.id + '_' + ids.ime
				var dualx = ids.ime + '_' + ids.id
				var isPaired = await groupModel.findOne({name: dual, createId: dual, dual: true}, {_id: 1})
				var isPairedx = await groupModel.findOne({name: dualx, createId: dualx, dual: true}, {_id: 1})
				if (isPaired)// thấy phòng TH1
				{
					socket.emit('pairing', {
						status: true,
						roomId: isPaired._id /*trả về id của phòng*/
					})
				} else if (isPairedx)
				{
					socket.emit('pairing', {
						status: true,
						roomId: isPairedx._id /*trả về id của phòng*/
					})
				} else
				{

					await groupModel({name: dual, createId: dual, adminIds: [ids.ime, ids.id], dual: true, private: true}).save()
					var isCreated = await groupModel.findOne({name: dual, createId: dual, dual: true, private: true}, {_id: 1})
					if (isCreated)
					{
						socket.emit('pairing', {
							status: true,
							roomId: isCreated._id /*trả về id của phòng*/
						})
					} else
					{
						console.log('ghép cặp không thành công')
						socket.emit('pairing', false)
					}
				}
			} catch (e)
			{
				console.log(e)
				socket.emit('pairing', false)
			}
		})

		//join - group chat
		socket.on('joinGroup', async (d) => {
			try
			{
				var thisRoom = await groupModel.findOne({_id: d.id})

				if (thisRoom)// thấy phòng
				{
					if (!thisRoom.userIds.includes(d.ime))
					{
						thisRoom.userIds.push(d.ime)
					}
					await groupModel(thisRoom).save()
					socket.join(thisRoom._id.toString())
					socket.emit('joinGroup', {
						status: true,
						roomId: thisRoom._id /*trả về id của phòng*/
					})
				}
				else
				{
					console.log('vào room thất bại')
					socket.emit('joinGroup', false)
				}
			} catch (e)
			{
				console.log(e)
				socket.emit('joinGroup', false)
			}
		})


		// syncMessage
		socket.on('syncMessage', async (ids) => {
			var messages = await messageModel.aggregate([
				{
					$match: {
						roomId: ids.roomId
					}
				},
				{
					$lookup: {
						from: 'personsettings',
						localField: 'userId',
						foreignField: 'userId',
						as: 'user'
					}
				},
				{
					$project: {
						_id: 1,
						content: 1,
						roomId: 1,
						userId: 1,
						isSent: 1,
						isRead: 1,
						isReceived: 1,
						createdAt: 1,
						updatedAt: 1,
						user: 1
					}
				},
				{
					$lookup: {
						from: 'icons',
						localField: '_id',
						foreignField: 'messageId',
						as: 'icons'
					}
				},
			])
			if (messages)
			{
				socket.emit('syncMessage', {
					status: true,
					data: messages,
					roomId: ids.roomId,
				})
			} else
			{
				socket.emit('syncMessage', false)
			}
		})

		//send message
		socket.on('sendMessage', async (d) => {
			await messageModel({
				content: d.message,
				roomId: d.roomId,
				userId: d.ime,
				token: d.token,
			}).save()
			var find = await groupModel.findOne({_id: d.roomId}, {userIds: 1})
			const users = find.userIds
			console.log('send mess 1', users)
			if (!users) {console.log('không thấy room !!!')}
			var isSent = await messageModel.aggregate([
				{
					$match: {
						roomId: d.roomId,
						userId: d.ime,
						token: d.token,
					}
				},
				{
					$lookup: {
						from: 'personsettings',
						localField: 'userId',
						foreignField: 'userId',
						as: 'username'
					}
				},
				{
					$project: {
						_id: 1,
						content: 1,
						roomId: 1,
						userId: 1,
						isSent: 1,
						isRead: 1,
						isReceived: 1,
						createdAt: 1,
						updatedAt: 1,
						username: 1
					}
				}
			])
			if (isSent)
			{
				console.log(isSent)
				for (var i = 0;i < users.length;i++)
				{
					var socketID = await SocketId.findOne({userId: users[i]}, {value: 1})
					console.log(socketID.value, typeof socketID.value)
					io.sockets.in(socketID.value).emit('sendMessage', {
						status: true,
						roomId: d.roomId,
						message: isSent[0]
					})
				}
			} else
			{
				console.log('gửi tin thất bại')
				socket.emit('sendMessage', {
					status: false,
				})
			}
		})
	}
}

module.exports = new Socket()