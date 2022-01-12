const mongoose = require('mongoose')// import moule mongoose
const Schema = mongoose.Schema;// khởi tạo biến khung dữ liệu
const mongooseDelete = require('mongoose-delete');//import moule mongoose delete

//add plugins
mongoose.plugin(mongooseDelete, {overrideMethods: 'all', deletedAt: true})//mount mongoose delete


const Permisson = new Schema({
	API: {type: String, default: '', required: true, },
	name: {type: String, default: ''},
	userIds: {type: String, default: ''},
	ranks: {type: String, default: ''},
	level: {type: String, default: ''},
	token: {type: String, default: ''},
}, {timestamps: true});

module.exports = mongoose.model('Permisson', Permisson)
