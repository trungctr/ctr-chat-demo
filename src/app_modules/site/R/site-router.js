//file định tuyến của category site

const router = require('express').Router()
const siteclr = require('../C/site-controller')
const logout = require('../../auth/C/auth-socket-controllers')

router.post('/logout', logout.logout)
router.get('/', siteclr.index)

module.exports = router
