const mongoose = require('mongoose')// import moule mongoose
const Schema = mongoose.Schema;// khởi tạo biến khung dữ liệu
const mongooseDelete = require('mongoose-delete');//import moule mongoose delete

//add plugins
mongoose.plugin(mongooseDelete, {overrideMethods: 'all', deletedAt: true})//mount mongoose delete

//configure schema
const PersonSetting = new Schema({
	userId: {type: String, default: '', required: true, },
	skin: {type: String, default: 'default.css'},
	langue: {type: String, default: 'VI'},
	hidden: {type: Boolean, default: false},
	online: {type: Boolean, default: true},
}, {timestamps: true})

module.exports = mongoose.model('PersonSetting', PersonSetting)
