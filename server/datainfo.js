const sqlite3 = require('sqlite3').verbose();
const DB = new sqlite3.Database('./DB.db', sqlite3.OPEN_READWRITE, err => {
    if (err) {
        console.log(`Error while Opening DB ${err}`);
    } else {
        console.log(`Database Connected`);
    }
});


DB.all("SELECT * FROM coinValue", (err, rows) => {
    if (err) return console.log("SQL err", err);
    let tmp = 0;
    rows.forEach(value => {
        tmp += parseFloat(value.value);
    });
    console.log("Sum: ", tmp, "Avg: ",tmp/rows.length);
})