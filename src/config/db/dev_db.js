// cấu hình kết nối DB
const mongoose = require('mongoose')

async function connect() {

    try {
		 await mongoose.connect('mongodb://root:nZ6uBvke6F38zcBp@103.90.233.204:27017/tradeline?authSource=admin', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
        console.log('Connect to local DB successfully')
    } catch (error) {
        console.log('Connect flailure !!!')
    }
}

module.exports = { connect }
