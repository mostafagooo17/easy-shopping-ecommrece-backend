const conn = require("../db/dbconnection");
const util = require("util");
const authhorized = async (req, res, next) => {
    const query = util.promisify(conn.query).bind(conn);
    const { token } = req.headers;
    const user = await query(" SELECT * from customers WHERE token = ?", [token]);
    if (user[0]) {
        next();
    } else {
        res.status(403).json({
            msg: " you are not autherized to access tis route !",
        });
    }


};
module.exports = authhorized;