module.exports = {
    encoding: function (s) {
        s = s.split("")
        s = s.reverse()
        s = s.join("")
        return s
    }
}
