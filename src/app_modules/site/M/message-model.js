const mongoose = require('mongoose')// import moule mongoose
const Schema = mongoose.Schema;// khởi tạo biến khung dữ liệu
const mongooseDelete = require('mongoose-delete');//import moule mongoose delete

//add plugins
mongoose.plugin(mongooseDelete, {overrideMethods: 'all', deletedAt: true})//mount mongoose delete

//configure schema
const Message = new Schema({
	content: {type: String, default: '', required: true, },
	token: {type: String, default: '', required: true, },
	roomId: {type: String, default: '', required: true, },
	userId: {type: String, default: '', required: true, },
	isSent: {type: Boolean, default: false},
	isRead: {type: Boolean, default: false},
	isReceived: {type: Boolean, default: false},
	ReadDate: {type: Date},
}, {timestamps: true})

module.exports = mongoose.model('Message', Message)
