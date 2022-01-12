const mongoose = require('mongoose')// import moule mongoose
const Schema = mongoose.Schema;// khởi tạo biến khung dữ liệu
const mongooseDelete = require('mongoose-delete');//import module mongoose delete

//add plugins
mongoose.plugin(mongooseDelete, {overrideMethods: 'all', deletedAt: true})//mount mongoose delete


const RefreshToken = new Schema({
	username: {type: String, default: '',},
	lastToken: {type: String, default: ''},
	refreshToken: {type: String, default: ''},
	userId: {type: String, default: '',required: true,},
}, {timestamps: true});

module.exports = mongoose.model('RefreshToken', RefreshToken)