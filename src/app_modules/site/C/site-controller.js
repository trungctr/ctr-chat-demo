//site controller

class SiteController {
	// [get]/
	index(req, res, next) {
		res.render('home')
	}
}
module.exports = new SiteController()
