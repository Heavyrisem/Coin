const Config = require('./Config.json');
const mysql = require('mysql');
const DB = mysql.createConnection(Config.DB);
DB.connect();


DB.query("select * from userinfo", (err, rows) => {

    rows.forEach(value => {
        if (value.MoneyBalance >= 50000000 || value.CoinBalance > 200) {

            console.log(value.name, value.CoinBalance, value.MoneyBalance);
        }
    })
    
    DB.destroy();
});
