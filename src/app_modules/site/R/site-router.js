//file định tuyến của category site

const router = require('express').Router()
const siteclr = require('../C/site-controller')

router.get('/', siteclr.index)

module.exports = router
