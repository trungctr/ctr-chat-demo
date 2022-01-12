const express = require('express');
const router = express.Router();

const authController = require('../C/auth-controllers');

router.post('/register', authController.register);
router.post('/login', authController.authLogin);
router.get('/logout', authController.authLogout);
router.get('/refresh', authController.refreshToken);

module.exports = router;
