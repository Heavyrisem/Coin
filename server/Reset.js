const Config = require('./Config.json');
const mysql = require('mysql');
const DB = mysql.createConnection(Config.DB);
DB.connect();


DB.query("select * from userinfo", (err, rows) => {

    rows.forEach(value => {
        if (value.MoneyBalance >= 50000000 || value.CoinBalance > 200) {
            let money = 50000000;
            let coin = 0;
            if (value.CoinBalance > 0) money += 10000000;

            DB.query(`UPDATE userinfo set MoneyBalance=${money}, CoinBalance=${coin} WHERE name='${value.name}'`, (err) => {return console.log(err)});
            console.log("초기화 대상 : ", value.name, value.CoinBalance, value.MoneyBalance);
        }
    })
    
    // DB.destroy();
});
