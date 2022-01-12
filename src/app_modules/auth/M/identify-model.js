const mongoose = require('mongoose')// import moule mongoose
const Schema = mongoose.Schema;// khởi tạo biến khung dữ liệu
const mongooseDelete = require('mongoose-delete');//import module mongoose delete

//add plugins
mongoose.plugin(mongooseDelete, {overrideMethods: 'all', deletedAt: true})//mount mongoose delete


const Identify = new Schema({
	username: {type: String, default: 'unidentified', },
	userId: {type: String, default: 'unidentified',required: true},
	rankId: {type: String, default: 'unidentified'},
	unitId: {type: String, default: 'unidentified'},
	majorId: {type: String, default: 'unidentified'},
	accessLevel: {type: Number, default: '0'},
}, {timestamps: true});

module.exports = mongoose.model('Identify', Identify)