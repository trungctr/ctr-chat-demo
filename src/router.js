//file định tuyến app
const site_router = require('./app_modules/site/R/site-router')


function route(app) {

	app.use('/', site_router)

}
module.exports = route
