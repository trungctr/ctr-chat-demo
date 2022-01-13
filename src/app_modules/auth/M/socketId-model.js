const mongoose = require('mongoose')// import moule mongoose
const Schema = mongoose.Schema;// khởi tạo biến khung dữ liệu
const mongooseDelete = require('mongoose-delete');//import moule mongoose delete

//add plugins
mongoose.plugin(mongooseDelete, {overrideMethods: 'all', deletedAt: true})//mount mongoose delete


const SocketId = new Schema({
	userId: {type: String, default: '', required: true, },
	socketId: {type: String, default: ''},
}, {timestamps: true});

module.exports = mongoose.model('SocketId', SocketId)