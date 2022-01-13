const mongoose = require('mongoose')// import moule mongoose
const Schema = mongoose.Schema;// khởi tạo biến khung dữ liệu
const mongooseDelete = require('mongoose-delete');//import moule mongoose delete

//add plugins
mongoose.plugin(mongooseDelete, {overrideMethods: 'all', deletedAt: true})//mount mongoose delete

//configure schema
const Chatroom = new Schema({
	name: {type: String, default: '', required: true, },
	createId: {type: String, default: '', required: true, },
	adminId: {type: String, default: '', required: true, },
	userIds: {type: Array, default: [], },
	private: {type: Boolean, default: 'false'},
	dual: {type: Boolean, default: 'false'},
}, {timestamps: true})

module.exports = mongoose.model('Chatroom', Chatroom)
