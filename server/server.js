const express = require('express');
const app = express();
// require('greenlock-express').init({
//     packageRoot: '../',
//     configDir: './greenlock.d',
//     maintainerEmail: 'pyo1748@gmail.com',
// }).serve(app);
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const SHA256 = require('./SHA256');
const fs = require('fs');

const Log = require('./log');

const sqlite3 = require('sqlite3').verbose();
const DB = new sqlite3.Database('./DB.db', sqlite3.OPEN_READWRITE, err => {
    if (err) {
        console.log(`Error while Opening DB ${err}`);
    } else {
        console.log(`Database Connected`);
    }
});

app.use(express.static('../build'));
app.use(require('cors')());
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

const PORT = 80;
const UpdateTick = 5000;
const MinimumCoinValue = 10000;
const DefaultCoinValue = 100000;
const MaximunCoinValue = 1000000;
let coinvalue = 0;


io.on("connection", client => {

    // console.log(`${client.id} 님이 접속했습니다.`);
    DB.all(`SELECT * FROM coinValue`, (err, rows) => {
        if (err) return Log.writeLog("System", "Error", "coinValue 데이터베이스 조회 오류");
        if (!rows.length) return;

        for (let i = 5; i > 0; i--) {
            if (!i||!rows[rows.length-1-i]) break;
            let date = new Date(rows[rows.length-1-i].date);
            io.emit("CoinValue", { coinValue: rows[rows.length-1-i].value, updateTime: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`, nextUpdate: UpdateTick, type: "none" });
            // console.log(rows[rows.length-1-i]);
        }
    })

    client.on("login", (data) => {
        if (data) {
            DB.get("SELECT * FROM userinfo WHERE name='${data.name}'", (err, row) => {
                console.log(row);
            });
        }
    })



    // client.on("disconnect", () => {
    //     console.log(`${client.id} 님이 접속을 종료했습니다.`)
    // });


});

function calculateCoinValue(value) {
    let now = new Date();
    let rand = 0;
    let type;

    let nextDir = RandomData(0, 2); // true is UP false is DOWN
    // console.log(nextDir)
    // 30+@, 30+(@*-1)
    // rand = DefaultCoinValue RandomData()
    switch (RandomData(0, 2)) {
        case 0: {
            rand = Math.abs(Math.sin(coinvalue) * RandomData(40, 81) * 20);
            type = "sin";
            break;
        }
        case 1: {
            rand = Math.abs(Math.tan(coinvalue) * RandomData(30, 51) * 20);
            type = "tan";
            break;
        }
    }

    // console.log("\n조정 전", rand);
    if (!nextDir) {
        if (coinvalue >= MaximunCoinValue / 3) { rand *= 1; } // 상한선의 1/3 이상일때, 100% 감소
        else { rand *= 0.7; console.log("하락율 30% 감소") } // 1/3 미만일 경우 30% 감소
        if (coinvalue >= MaximunCoinValue - MaximunCoinValue / 3) { rand *= 1.5; console.log("하락율 50% 증가") } // 상한선의 2/3 이상일때 130%감소
        if (coinvalue <= DefaultCoinValue) { rand = rand * 0.1; console.log("하락율 900% 감소") }
        //  {rand *= 0.5;console.log("하락율 50% 감소")} //상한선의 1/3 이하일때, 50% 감소후 하락
        rand *= -1;
    } else {
        if (coinvalue >= MaximunCoinValue / 3) { rand *= 1; } //상한선의 1/3 이상일때, 100% 증가
        else { rand *= 1.3; console.log("상승률 130% 증가") } // 1/3 미만일 경우 130% 증가
        if (coinvalue <= DefaultCoinValue) { rand *= 5; console.log("상승율 500% 증가") } //기본가격보다 낮을때 30% 추가
        if (coinvalue >= MaximunCoinValue - MaximunCoinValue / 3) { rand *= 0.7; console.log("상승율 30% 감소") } // 상한선의 2/3 이상일때 70% 증가
        rand *= 1.9;
        //  {rand *= 1.5;console.log("상승율 150% 증가")} //상한선의 1/3 이하일때, 20% 추가후 증가
    }

    // console.log("조정 후", rand);

    rand += parseFloat(coinvalue);

    if (rand >= MaximunCoinValue) {
        rand += MinimumCoinValue * RandomData(-8, -2);
        console.log("Maximum Value Exceed", rand);
    }


    // rand = parseFloat(rand).toFixed(2)
    rand = parseInt(rand);
    if (rand < MinimumCoinValue) rand = MinimumCoinValue;
    coinvalue = rand;

    io.emit("CoinValue", { coinValue: coinvalue, updateTime: `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`, nextUpdate: UpdateTick, type: type });
    DB.run(`INSERT INTO coinValue(value, date) VALUES('${coinvalue}', '${now}')`);
    setTimeout(calculateCoinValue, UpdateTick);

}


function RandomData(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

app.get("/", (req, res) => {
    fs.readFile(`../build/index.html`, (err, data) => {
        if (err) {
            Log.writeLog("System", "CriticalError", "서비스 불가능, index.html 로드중 오류가 발생했습니다."+err);
            return res.send("서버에 치명적인 오류가 발생했습니다.");
        } else {
            res.writeHead(200, {'Content-Type': 'text/Html'});
            res.end(data);
        }
    })
})

app.post("/login", (req, res) => {
    if (!req.body.passwd || !req.body.id) {
        Log.writeLog("System", "Information", "빈 데이터로 로그인 시도 " + req.headers['x-forwarded-for'] || req.connection.remoteAddress);
        return res.send({ msg: "WRONG_DATA" });
    }
    DB.get(`SELECT * FROM userinfo WHERE name='${req.body.id}'`, (err, row) => {
        if (err)  { res.send({msg: "데이터베이스 조회 오류"}); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err) }
        if (row) {
            if (row.passwd == SHA256(req.body.passwd)) {
                res.send({ id: row.name, CoinBalance: row.CoinBalance, MoneyBalance: row.MoneyBalance });
                Log.writeLog("System", "Information", `${row.name} 사용자 로그인 성공 ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
            } else {
                Log.writeLog("System", "Information", `${req.body.id} 비밀번호 불일치 ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
                res.send({ msg: "WRONG_PASSWD" });
            }
        } else {
            Log.writeLog("System", "Information", `${req.body.id} 로그인 실패 ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
            res.send({ msg: "NO_USER" });
        }
    })
});

app.post("/register", (req, res) => {
    if (!req.body.passwd || !req.body.id) {
        Log.writeLog("System", "Information", "빈 데이터로 회원가입 시도 " + req.headers['x-forwarded-for'] || req.connection.remoteAddress);
        return res.send({ msg: "WRONG_DATA" });
    }
    DB.get(`SELECT * FROM userinfo WHERE name='${req.body.id}'`, (err, row) => {
        if (err)  { res.send({msg: "데이터베이스 조회 오류"}); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err) }
        if (row) {
            Log.writeLog("System", "Information", `${row.name} 사용자 중복 회원가입 시도 ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
            return res.send({ msg: "USER_EXISTS" });
        } else {
            DB.run(`INSERT INTO userinfo(name, passwd, CoinBalance, MoneyBalance) VALUES("${req.body.id}", "${SHA256(req.body.passwd)}", "100", "300000")`, (err, row) => {
                if (err)  { res.send({msg: "데이터베이스 조회 오류"}); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err) }
                Log.writeLog("System", "Information", `${req.body.id} 회원가입 성공 ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
                return res.send({ id: req.body.id });
            })
        }
    })
});

app.post("/buy", (req, res) => {
    if (!req.body.id || !req.body.Amount) {
        Log.writeLog("System", "Trade", "빈 데이터로 구매 시도 " + req.headers['x-forwarded-for'] || req.connection.remoteAddress);
        return res.send({ msg: "WRONG_DATA" });
    }
    DB.get(`SELECT * FROM userinfo WHERE name='${req.body.id}'`, (err, row) => {
        if (err)  { res.send({msg: "데이터베이스 조회 오류"}); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err) }
        
        if (row) {

            let preCal = parseInt(coinvalue) * parseInt(req.body.Amount);
            if (parseInt(row.MoneyBalance) >= preCal) {
                DB.run(`UPDATE userinfo SET MoneyBalance=${parseInt(row.MoneyBalance) - preCal}, CoinBalance=${parseInt(row.CoinBalance) + parseInt(req.body.Amount)} WHERE name='${req.body.id}'`, err => {
                    if (err)  { res.send({msg: "데이터베이스 조회 오류"}); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err) }

                    Log.writeLog(req.body.id, "Trade", `${row.name} ${req.body.Amount} 코인 구매, 잔액 ${parseInt(row.CoinBalance) + parseInt(req.body.Amount)}`);
                    return res.send({ CoinBalance: parseInt(row.CoinBalance) + parseInt(req.body.Amount), MoneyBalance: parseInt(row.MoneyBalance) - preCal });
                });
            } else {
                Log.writeLog(req.body.id, "Trade", `${row.name} 코인 구매 실패, 잔액부족`);
                return res.send({ msg: "MONEY_NOT_ENOUGH" });
            }

        } else {
            Log.writeLog("System", "Trade", `${req.body.id} 사용자가 없습니다 ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
            return res.send({ msg: "USER_NOT_FOUND" });
        }
    })
})


app.post("/sell", (req, res) => {
    if (!req.body.id || !req.body.Amount) {
        Log.writeLog("System", "Trade", "빈 데이터로 판매 시도 " + req.headers['x-forwarded-for'] || req.connection.remoteAddress);
        return res.send({ msg: "WRONG_DATA" });
    }
    DB.get(`SELECT * FROM userinfo WHERE name='${req.body.id}'`, (err, row) => {
        if (err)  { res.send({msg: "데이터베이스 조회 오류"}); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err) }
        if (row) {

            let preCal = coinvalue * req.body.Amount;

            if (parseInt(row.CoinBalance) >= parseInt(req.body.Amount)) {
                DB.run(`UPDATE userinfo SET MoneyBalance=${parseInt(row.MoneyBalance) + preCal}, CoinBalance=${parseInt(row.CoinBalance) - parseInt(req.body.Amount)} WHERE name='${req.body.id}'`, err => {
                    if (err)  { res.send({msg: "데이터베이스 조회 오류"}); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err) }
                    Log.writeLog(req.body.id, "Trade", `${row.name} ${req.body.Amount} 코인 판매, 잔액 ${parseInt(row.MoneyBalance) + preCal}`);
                    return res.send({ CoinBalance: parseInt(row.CoinBalance) - parseInt(req.body.Amount), MoneyBalance: parseInt(row.MoneyBalance) + preCal });
                });
            } else {
                Log.writeLog(req.body.id, "Trade", `${row.name} 코인 판매 실패, 코인 부족`);
                return res.send({ msg: "COIN_NOT_ENOUGH" });
            }

        } else {
            Log.writeLog("System", "Trade", `${req.body.id} 사용자가 없습니다 ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
            return res.send({ msg: "USER_NOT_FOUND" });
        }
    })
})

app.post("/getWise", (req, res) => {
    DB.all(`SELECT * FROM wiseSaying`, (err, rows) => {
        if (err) return console.log(err);
        if (rows.length) {
            let n = Math.floor(Math.random() * (rows.length - 0));
            res.send({ Author: rows[n].Author, Message: rows[n].Message });
        } else {
            res.send({ msg: "NO_DATA" });
        }
    })
})

// Develope Tools

app.post("/wise", (req, res) => {
    DB.get(`SELECT * FROM wiseSaying WHERE Message='${req.body.Message}'`, (err, row) => {
        if (row) return res.send("ALREADY EXISTS");

        DB.run(`INSERT INTO wiseSaying(Author, Message) VALUES('${req.body.Author}', '${req.body.Message}')`, err => {
            if (err) return console.log(err);
        });
        res.send("OK");
    })
})

// Admin Panel

app.post("/setValue", (req, res) => {
    req.body.value = parseInt(req.body.value);
    if (!(req.body.key == "COIN") || isNaN(req.body.value)) {
        res.send({msg: "You are not admin"});
        Log.writeLog("Admin", "NotPremitted", `잘못된 접근 ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
        return;
    }
    Log.writeLog("Admin", "SetValue", "Set Coinvalue to " + req.body.value);
    coinvalue = req.body.value;
    res.send({value: coinvalue});
})

app.post("/getLog", (req, res) => {
    if (!(req.body.key == "COIN")) {
        res.send({msg: "You are not admin"});
        Log.writeLog("Admin", "NotPremitted", `잘못된 접근 ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
        return;
    }
    Log.writeLog("Admin", "GetLog", `로그 조회 ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
    DB.all(`SELECT * FROM Log`, (err, rows) => {
        if (err)  { res.send({msg: "데이터베이스 조회 오류"}); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err) }
        res.send(rows);
    })
})

server.listen(PORT, () => {
    DB.get("SELECT * FROM coinValue where id=(SELECT MAX(id) FROM coinValue)", (err, row) => {
        if (err) return Log.writeLog("System", "Error", "Error while Get Last Value", err);

        if (row) {
            coinvalue = row.value;
        } else {
            Log.writeLog("System", "Information", "Loading Default CoinValue");
            coinvalue = DefaultCoinValue;
        }
        calculateCoinValue();
    })
});