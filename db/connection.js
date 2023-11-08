var mysql = require("mysql");
var config;
config = {
  mysql_pool: mysql.createPool({
    host: 'NULL',
    user: 'athulslv_muthukumar',
    password: 'Athulya@123',
    database: 'athulslv_sal_subscriber102',
    multipleStatements: true,
    connectionLimit: 100, 
  }),
};

module.exports = config;