var mysql = require("mysql");
var config;
config = {
  mysql_pool: mysql.createPool({
    host: '162.241.123.158',
    user: 'theatgg6_pranesh',
    password: '021230Srp!',
    database: 'theatgg6_sal_subscriber102',
    multipleStatements: true,
    connectionLimit: 100, 
  }),
};

module.exports = config;
