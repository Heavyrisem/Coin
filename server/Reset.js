const Config = require('./Config.json');
const mysql = require('mysql');
const DB = mysql.createConnection(Config.DB);
DB.connect();

const RandomToken = require("./RandomToken");

DB.query("select * from userinfo", (err, rows) => {
    
    rows.forEach(value => {
        console.log(value.name);
        if (!value.Token) {
            DB.query(`UPDATE userinfo SET Token='${RandomToken(30)}' WHERE name='${value.name}'`, (err) => {if(err) console.log(err)});
        }
    })
    
    // DB.destroy();
});
