const mongoose = require('mongoose')// import moule mongoose
const Schema = mongoose.Schema;// khởi tạo biến khung dữ liệu
const slug = require('mongoose-slug-generator');// import moule mongoose slug generator
const mongooseDelete = require('mongoose-delete');//import moule mongoose delete

//add plugins
mongoose.plugin(slug) //mount mongoose slug generator
mongoose.plugin(mongooseDelete, {overrideMethods: 'all', deletedAt: true})//mount mongoose delete

//configure schema
const Message = new Schema({
	content: {type: String, default: '', required: true, },
	userId: {type: String, default: 'default.css'},
	isSent: {type: Boolean, default: false},
	isRead: {type: Boolean, default: false},
	isReceived: {type: Boolean, default: false},
	slug: {type: String, slug: ['skin'], unique: true}
}, {timestamps: true});

module.exports = mongoose.model('Message', Message)
