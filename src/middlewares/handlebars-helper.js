const date = require('s-date')//import thư viện s-date để xử lý fomat ngày tháng

module.exports = {
	plus1: (a) => a + 1,
	sum: (a,b) => a + b,
	isEq: (a, b) => a == b,
	notEq: (a, b) => a !== b,
	lt: (a, b) => a < b,
	gt: (a, b) => a > b,
	ngt: (a, b) => Number(a) > Number(b),
	ngte: (a, b) => Number(a) >= Number(b),
	nlt: (a, b) => Number(a) < Number(b),
	dateFomat: function (d) {
		if (d != null)
		{
			return date('{dd}/{mm}/{yyyy}-{hh24}:{Minutes}', d);
		} else
		{
			return '--';
		}
	},
}