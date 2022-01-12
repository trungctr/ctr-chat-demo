//import mudules
const path = require('path')//import thư viện mặc định path

const express = require('express')//import thư viện express
const app = express()

const methodOverride = require('method-override')//import thư viện method override của express

const handlebars = require('express-handlebars')//import thư viện express-handles bar tạo các view template cho app

const db = require('./config/db/dev_db')//import cấu hình DB của app

const route = require('./router')//import định tuyến của app

const responseTime = require('response-time')

const cookieParser = require('cookie-parser')

const ctrHelpers = require('./middlewares/handlebars-helper')

var server = require('http').Server(app)

const io = require('socket.io')(server)

var bytes = require('bytes')

var limit = bytes('512MB')

const socketMethods = require('./app_modules/site/C/site-socket-controller')
//___________________________________________________________________________________________


async function appMainProcess() {
	//connect to DB
	await db.connect()
	//___________________________________________________________________________________________


	// index static file
	app.use(express.static(path.join(__dirname, 'public')))
	//___________________________________________________________________________________________


	// middle ware
	const env = require('./config/variables/env')//import các biến môi trường

	process.on('warning', (warning) => {
		console.log(warning.stack);
	});

	app.use(express.urlencoded({extended: true, limit: limit}))
	app.use(express.json({limit: limit}))
	app.use(express.raw({limit: limit}))
	app.use(methodOverride('_method'))
	app.use(cookieParser())
	app.use(responseTime((req, res, time) => {
		console.log(req._startTime, `[${ req.method }]${ req.originalUrl } - ${ time }ms`);
	}))
	//___________________________________________________________________________________________


	//template engine
	app.engine(
		'hbs',
		handlebars({
			extname: '.hbs',
			helpers: ctrHelpers,
		})
	);
	app.set('view engine', 'hbs')//chuyển đuôi mặc định của view thành hbs

	app.set('views', path.join(__dirname, 'app_views'))//set vị trí đặt views hiển thị

	//___________________________________________________________________________________________


	//route init
	route(app)

	//server init
	server.listen(env.PORT, () => console.log(`App statted -> lisening request from ${ env.DO_MAIN } \nStream limit:`, limit, 'bytes\nSever ready'))

	//___________________________________________________________________________________________


	//realtime sockets
	io.on('connection', (socket) => {socketMethods.methods(io, socket)})
}

appMainProcess()
//________________________________________________________________