//socket methods
const auths = require('../../auth/C/auth-socket-controllers')

class Socket {
	methods(io, socket) {
		console.log(socket.id, 'đã kết nối')
		var identify
		var permission
		socket.on('dang-ky', (data) => {
			if (auths.register(data))
			{
				socket.emit('dang-ky', true)
			}
			
		})
		socket.on('disconnect', () => {
			console.log(socket.id, 'ngắt kết nối')
		})
		socket.on('person-chat', (d) => {
			console.log(socket.id, d.name, ':', d.message)
			// gửi dữ liệu nhận được cho toàn bộ clients
			var toAll = d
			toAll.message = 'to all' + toAll.message
			io.sockets.emit('person-chat', toAll)

			// chỉ trả lời cho duy nhất client đã gửi
			var d2 = {}
			d2.name = 'Server'
			d2.message = 'you said "' + d.message + '"(only you see this)'
			socket.emit('person-chat', d2)

			// trả lời cho tất cả clients trừ client đã gửi
			var d3 = {}
			d3.name = 'Server'
			d3.message = '(' + d.name + ')' + d.message
			socket.broadcast.emit('person-chat', d3)

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