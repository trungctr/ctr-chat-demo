module.exports = {
	mutilMongooseToOject: function (m) {
		if (m)
		{
			return m.map(m => m.toObject())
		}
	},
	mongooseToOject: function (m) {
		if (m)
		{
			return m ? m.toObject() : m
		}
	}
}
