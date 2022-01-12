class Environment {
	//Token values:
	REFRESH_TOKEN_SIZE = 100
	ACCESS_TOKEN_SECRET = 'ofVsI9qTlHwLywWDcMQYPpq8Z9ELYszG1KnVUUFj3DcfEJDnICQjgVD0xMem4neY9Xt0iuMdLYp9K15hUNJs8YnLBz0r3X6xCkz3'
	ACCESS_TOKEN_LIFE = '15m'
	SALT_ROUNDS = 16

	//port values:
	PORT = 3002
	DO_MAIN = 'https://localhost:3002/'

	//name of cookies:
	ACCESS_TOKEN_NAME = 'data1'
	REFRESH_TOKEN_NAME = 'data2'

}
module.exports = new Environment