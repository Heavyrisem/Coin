const Config = require("./Config.json")

const express = require('express');
const app = express();
const rateLimit = require("express-rate-limit");
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const SHA256 = require('./SHA256');
const fs = require('fs');

const Log = require('./log');
const Consolelog = require('./consolelog').init('server');

const mysql = require('mysql');
const DB = mysql.createConnection(Config.DB);
DB.connect();

const RandomToken = require("./RandomToken");
const BlockCountry = require("./Middle/BlockCounty");

app.use(BlockCountry);
app.use(rateLimit({
    windowMs: 60 * 1000, // 30 sec
    max: 30
}))
app.use(require('cors')());
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

const PORT = 80;
const UpdateTick = 8500;
const MinimumCoinValue = 10000;
const DefaultCoinValue = 100000;
const MaximunCoinValue = 1000000;
let coinvalue = 0;

const Client_VER = 5;

let KeepAliveDB = setInterval(() => {
    DB.query(`SELECT 1;`);
    Log.writeLog("System", "HartBeatDB", "Send HartBeat to DataBase", "");
}, 1000 * 10 * 60); // Every 10 min


app.use((req, res, next) => {
    if (!req.url.indexOf("index.html") == -1 || req.url != '/') return next();
    
    if (req.header('User-Agent').indexOf("Headless") != -1) {
        Log.writeLog("System", "BotDetected", req.header('User-Agent'), req.headers['x-forwarded-for'] || req.connection.remoteAddress);
        return res.send("오류가 발생했습니다.");
    }

    Log.writeLog("System", "MainPage", (req.header('User-Agent')), req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    fs.readFile(`../build/index.html`, (err, data) => {
        if (err) {
            Log.writeLog("System", "CriticalError", "서비스 불가능, index.html 로드중 오류가 발생했습니다." + err);
            return res.send("서버에 치명적인 오류가 발생했습니다.");
        } else {
            res.writeHead(200, { 'Content-Type': 'text/Html' });
            res.end(data);
        }
    })
})
app.use(express.static('../build'));


let ConnectedSocketCounter = 0;
io.on("connection", client => {

    ConnectedSocketCounter++;
    console.log("New connect From ", client.handshake.address, ConnectedSocketCounter);
    client.emit("version");

    DB.query(`SELECT * FROM coinValue ORDER BY id DESC limit 5`, (err, rows) => {
        if (err) return Log.writeLog("System", "Error", "coinValue 데이터베이스 조회 오류");
        if (!rows.length) return;
        rows = rows.reverse();

        rows.forEach(row => {
            let date = new Date(row.date);
            client.emit("CoinValue", { coinValue: row.value, updateTime: `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`, nextUpdate: UpdateTick, type: "none" });
        });
    })


    let disconnectTimer;
    let checkVersion = setInterval(() => {
        
        client.emit("version");
        disconnectTimer = setTimeout(() => {
            console.log(client.handshake.address, "Not Responding For asking Version");
            client.disconnect();
            clearInterval(checkVersion);
        }, 5000);
    }, 30000);

    client.on("version", ver => {
        if (ver != Client_VER) {
            // console.log("Wrong Version Response From", client.handshake.address, "With", ver);
            client.emit("refresh");
            client.disconnect();
        } else {
            // console.log("Version Response From", client.handshake.address, "With", ver);
            disconnectTimer = clearTimeout(disconnectTimer);
        }
    })

    client.on("imBot", () => {
        console.log("Bot Detected", client.handshake.address);
        client.emit("refresh")
        client.disconnect();
    })
    
    client.on("disconnect", () => {
        clearInterval(checkVersion);
        clearTimeout(checkVersion);
        ConnectedSocketCounter--;
    });


});

function calculateCoinValue() {
    let now = new Date();
    let rand = 0;
    let type;

    let nextDir = RandomData(0, 2); // true is UP false is DOWN
    // console.log(nextDir)
    // 30+@, 30+(@*-1)
    // rand = DefaultCoinValue RandomData()
    switch (RandomData(0, 2)) {
        case 0: {
            rand = Math.abs(Math.sin(coinvalue) * RandomData(40, 65) * 40);
            type = "sin";
            break;
        }
        case 1: {
            rand = Math.abs(Math.tan(coinvalue) * RandomData(30, 50) * 40);
            type = "tan";
            break;
        }
    }

    // console.log("\n조정 전", rand);
    if (!nextDir) {
        if (coinvalue >= MaximunCoinValue / 3) { rand *= 1; } // 상한선의 1/3 이상일때, 100% 감소
        else { rand *= 0.7; } // 1/3 미만일 경우 30% 감소
        if (coinvalue >= MaximunCoinValue - MaximunCoinValue / 4) { rand *= 3.0; } // 상한선의 2/3 이상일때 130%감소
        if (coinvalue <= DefaultCoinValue) { rand = rand * 0.1; }
        //  {rand *= 0.5; //상한선의 1/3 이하일때, 50% 감소후 하락
        if (RandomData(0, 2)) rand *= 1.3;

        rand *= -1;
    } else {
        if (coinvalue >= MaximunCoinValue / 3) { rand *= 1; } //상한선의 1/3 이상일때, 100% 증가
        else { rand *= 1.3; } // 1/3 미만일 경우 130% 증가
        if (coinvalue <= DefaultCoinValue) { rand *= 5; } //기본가격보다 낮을때 30% 추가
        if (coinvalue >= MaximunCoinValue - MaximunCoinValue / 3) { rand *= 0.7; } // 상한선의 2/3 이상일때 70% 증가
        { rand *= 1.5; } //상한선의 1/3 이하일때, 50% 추가후 증가
    }

    if (!RandomData(0, 101)) { rand = (coinvalue / 2) * -1; console.log("폭락") }
    // console.log("조정 후", rand);

    rand += parseInt(coinvalue);

    if (rand >= MaximunCoinValue) {
        rand = coinvalue / RandomData(5, 2);
        console.log("Maximum Value Exceed", rand);
    }


    // rand = parseFloat(rand).toFixed(2)
    rand = parseInt(rand);
    if (rand < MinimumCoinValue) rand = MinimumCoinValue;
    coinvalue = rand;

    io.emit("CoinValue", { coinValue: coinvalue, updateTime: `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`, nextUpdate: UpdateTick, type: type });
    DB.query(`INSERT INTO coinValue(value, date) VALUES('${coinvalue}', '${now}')`, (err) => {
        if (err) return Log.writeLog("System", "DataBaseERROR", "Error while Writing CoinValue Data " + err, "");
    });
    setTimeout(calculateCoinValue, UpdateTick);

}


function RandomData(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}


app.post("/login", (req, res) => {
    if (!req.body.passwd || !req.body.id) {
        Log.writeLog("System", "Login", "빈 데이터로 로그인 시도 ", req.headers['x-forwarded-for'] || req.connection.remoteAddress);
        return res.send({ msg: "WRONG_DATA" });
    }
    DB.query(`SELECT * FROM userinfo WHERE name='${req.body.id}'`, (err, row) => {
        if (err) { res.send({ msg: "데이터베이스 조회 오류" }); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err, req.headers['x-forwarded-for'] || req.connection.remoteAddress) }
        if (row.length == 0) row = undefined;
        else row = row[0];
        if (row) {
            if (row.passwd == SHA256(req.body.passwd)) {
                res.send({ id: row.name, CoinBalance: row.CoinBalance, MoneyBalance: row.MoneyBalance, Token: row.Token });
                Log.writeLog("System", "Login", `${row.name} 사용자 로그인 성공`, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
            } else {
                Log.writeLog("System", "Login", `${req.body.id} 비밀번호 불일치`, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
                res.send({ msg: "WRONG_PASSWD" });
            }
        } else {
            Log.writeLog("System", "Login", `${req.body.id} 로그인 실패`, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
            res.send({ msg: "NO_USER" });
        }
    })
});

app.post("/register", (req, res) => {
    if (!req.body.passwd || !req.body.id) {
        Log.writeLog("System", "Register", "빈 데이터로 회원가입 시도 ", req.headers['x-forwarded-for'] || req.connection.remoteAddress);
        return res.send({ msg: "WRONG_DATA" });
    }
    DB.query(`SELECT * FROM userinfo WHERE name='${req.body.id}'`, (err, row) => {
        if (err) { res.send({ msg: "데이터베이스 조회 오류" }); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err, req.headers['x-forwarded-for'] || req.connection.remoteAddress) }
        if (row.length == 0) row = undefined;
        else row = row[0];
        if (row) {
            Log.writeLog("System", "Register", `${row.name} 사용자 중복 회원가입 시도`, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
            return res.send({ msg: "USER_EXISTS" });
        } else {
            let Token = RandomToken(30);
            DB.query(`INSERT INTO userinfo(name, passwd, CoinBalance, MoneyBalance, Token) VALUES("${req.body.id}", "${SHA256(req.body.passwd)}", "10", "300000", "${Token}")`, (err, row) => {
                if (err) { res.send({ msg: "데이터베이스 조회 오류" }); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err, req.headers['x-forwarded-for'] || req.connection.remoteAddress) }
                Log.writeLog("System", "Register", `${req.body.id} 회원가입 성공`, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
                return res.send({ id: req.body.id, Token: Token });
            })
        }
    })
});

app.post("/buy", (req, res) => {
    if (!req.body.id || !req.body.Amount || !req.body.Token) {
        Log.writeLog("System", "Trade", "빈 데이터로 구매 시도 ", req.headers['x-forwarded-for'] || req.connection.remoteAddress);
        return res.send({ msg: "WRONG_DATA" });
    }
    DB.query(`SELECT * FROM userinfo WHERE name='${req.body.id}' AND Token='${req.body.Token}'`, (err, row) => {
        if (err) { res.send({ msg: "데이터베이스 조회 오류" }); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err, req.headers['x-forwarded-for'] || req.connection.remoteAddress) }
        if (row.length == 0) row = undefined;
        else row = row[0];

        if (row) {

            let preCal = parseInt(coinvalue) * parseInt(req.body.Amount);
            if (parseInt(row.MoneyBalance) >= preCal) {
                DB.query(`UPDATE userinfo SET MoneyBalance=${parseInt(row.MoneyBalance) - preCal}, CoinBalance=${parseInt(row.CoinBalance) + parseInt(req.body.Amount)} WHERE name='${req.body.id}'`, err => {
                    if (err) { res.send({ msg: "데이터베이스 조회 오류" }); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err, req.headers['x-forwarded-for'] || req.connection.remoteAddress) }

                    Log.writeLog(req.body.id, "Trade", `${req.body.Amount} 코인 구매, ${parseInt(row.CoinBalance) + parseInt(req.body.Amount)} JG, ${parseInt(row.MoneyBalance) - preCal} KRW, ${coinvalue}`, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
                    return res.send({ CoinBalance: parseInt(row.CoinBalance) + parseInt(req.body.Amount), MoneyBalance: parseInt(row.MoneyBalance) - preCal });
                });
            } else {
                Log.writeLog(req.body.id, "Trade", `코인 구매 실패, 잔액부족`, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
                return res.send({ msg: "MONEY_NOT_ENOUGH" });
            }

        } else {
            Log.writeLog("System", "Trade", `${req.body.id} 사용자가 없습니다 ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
            return res.send({ msg: "USER_NOT_FOUND" });
        }
    })
})


app.post("/sell", (req, res) => {
    if (!req.body.id || !req.body.Amount || !req.body.Token) {
        Log.writeLog("System", "Trade", "빈 데이터로 판매 시도 ", req.headers['x-forwarded-for'] || req.connection.remoteAddress);
        return res.send({ msg: "WRONG_DATA" });
    }
    DB.query(`SELECT * FROM userinfo WHERE name='${req.body.id}' AND Token='${req.body.Token}'`, (err, row) => {
        if (err) { res.send({ msg: "데이터베이스 조회 오류" }); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err, req.headers['x-forwarded-for'] || req.connection.remoteAddress) }
        if (row.length == 0) row = undefined;
        else row = row[0];
        if (row) {

            let preCal = coinvalue * req.body.Amount;

            if (parseInt(row.CoinBalance) >= parseInt(req.body.Amount)) {
                DB.query(`UPDATE userinfo SET MoneyBalance=${parseInt(row.MoneyBalance) + preCal}, CoinBalance=${parseInt(row.CoinBalance) - parseInt(req.body.Amount)} WHERE name='${req.body.id}'`, err => {
                    if (err) { res.send({ msg: "데이터베이스 조회 오류" }); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err, req.headers['x-forwarded-for'] || req.connection.remoteAddress) }
                    Log.writeLog(req.body.id, "Trade", `${req.body.Amount} 코인 판매, ${parseInt(row.CoinBalance) - parseInt(req.body.Amount)}, ${parseInt(row.MoneyBalance) + preCal} KRW, ${coinvalue}`, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
                    return res.send({ CoinBalance: parseInt(row.CoinBalance) - parseInt(req.body.Amount), MoneyBalance: parseInt(row.MoneyBalance) + preCal });
                });
            } else {
                Log.writeLog(req.body.id, "Trade", `코인 판매 실패, 코인 부족`, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
                return res.send({ msg: "COIN_NOT_ENOUGH" });
            }

        } else {
            Log.writeLog("System", "Trade", `${req.body.id} 사용자가 없습니다, ${req.body.Token}`, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
            return res.send({ msg: "USER_NOT_FOUND" });
        }
    })
})

// External Component

app.post("/getWise", (req, res) => {
    DB.query(`SELECT * FROM wiseSaying`, (err, rows) => {
        if (err) return console.log(err);
        if (rows.length) {
            let n = Math.floor(Math.random() * (rows.length - 0));
            res.send({ Author: rows[n].Author, Message: rows[n].Message });
        } else {
            res.send({ msg: "NO_DATA" });
        }
    })
});

app.post("/ranking", (req, res) => {
    DB.query(`SELECT * FROM userinfo`, (err, rows) => {
        if (err) { res.send({ msg: "데이터베이스 조회 오류" }); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err, req.headers['x-forwarded-for'] || req.connection.remoteAddress) }
        if (rows.length) {
            let currentvalue = coinvalue;
            let result = [];
            rows.sort((a, b) => {
                let tmpa = parseInt(a.MoneyBalance) + (currentvalue * parseInt(a.CoinBalance));
                let tmpb = parseInt(b.MoneyBalance) + (currentvalue * parseInt(b.CoinBalance));
                return tmpa > tmpb ? -1 : tmpa < tmpb ? 1 : 0;
            });

            let filter = ["용쿤2", "용쿤3", "용쿤4", "용쿤5"];

            rows.forEach((userdata, idx) => {
                if (filter.indexOf(userdata.name) != -1) rows.splice(idx, 1);
            });

            rows.forEach((userdata, idx) => {
                if (idx > 4) return;
                result.push({
                    name: userdata.name,
                    Balance: parseInt(userdata.MoneyBalance) + (currentvalue * parseInt(userdata.CoinBalance))
                })
            })

            if (req.body.id != undefined) {
                Log.writeLog(req.body.id, "GetRanking", "순위 조회", req.headers['x-forwarded-for'] || req.connection.remoteAddress);
                rows.some((userdata, idx) => {
                    if (userdata.name == req.body.id) {
                        res.send({ ranking: result, currentRank: idx + 1, balance: parseInt(userdata.MoneyBalance) + (currentvalue * parseInt(userdata.CoinBalance)) });
                        return true;
                    }
                    if (idx == rows.length - 1) return res.send({ ranking: result });
                })
            } else {
                res.send({ ranking: result });
            }
        } else {
            res.send({ msg: "NO_DATA" });
        }
    });
})

// Develope Tools

app.post("/wise", (req, res) => {
    DB.query(`SELECT * FROM wiseSaying WHERE Message='${req.body.Message}'`, (err, row) => {
        if (row) return res.send("ALREADY EXISTS");

        DB.query(`INSERT INTO wiseSaying(Author, Message) VALUES('${req.body.Author}', '${req.body.Message}')`, err => {
            if (err) return console.log(err);
        });
        res.send("OK");
    })
})

// Admin Panel

app.post("/setValue", (req, res) => {
    req.body.value = parseInt(req.body.value);
    if (!(req.body.key == Config.key) || isNaN(req.body.value)) {
        res.send({ msg: "You are not admin" });
        Log.writeLog("Admin", "NotPremitted", `잘못된 접근`, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
        return;
    }
    Log.writeLog("Admin", "SetValue", "Set Coinvalue to " + req.body.value, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    coinvalue = req.body.value;
    res.send({ value: coinvalue });
})

app.post("/getLog", (req, res) => {
    if (!(req.body.key == Config.key)) {
        res.send({ msg: "You are not admin" });
        Log.writeLog("Admin", "NotPremitted", `잘못된 접근`, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
        return;
    }
    Log.writeLog("Admin", "GetLog", `로그 조회`, req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    DB.query(`SELECT * FROM Log`, (err, rows) => {
        if (err) { res.send({ msg: "데이터베이스 조회 오류" }); return Log.writeLog(req.body.id, "Error", "데이터베이스 조회 오류" + err, req.headers['x-forwarded-for'] || req.connection.remoteAddress) }
        res.send(rows);
    })
})

server.listen(PORT, () => {
    DB.query("SELECT * FROM coinValue where id=(SELECT MAX(id) FROM coinValue)", (err, row) => {
        if (err) return Log.writeLog("System", "Error", "Error while Get Last Value", err);
        if (row.length == 0) row = undefined;
        else row = row[0];

        if (row) {
            coinvalue = row.value;
        } else {
            Log.writeLog("System", "Information", "Loading Default CoinValue");
            coinvalue = DefaultCoinValue;
        }
        calculateCoinValue();
    })
});

// CREATE TABLE Log (
// 	id INTEGER NOT NULL UNIQUE PRIMARY KEY AUTO_INCREMENT,
// 	Date TEXT NOT NULL,
// 	Message TEXT NOT NULL,
// 	Type TEXT NOT NULL,
// 	Author TEXT NOT NULL
// );

// CREATE TABLE coinValue (
// 	id INTEGER AUTO_INCREMENT PRIMARY KEY UNIQUE,
// 	value TEXT NOT NULL,
// 	date INTEGER NOT NULL
// );

// CREATE TABLE userinfo (
// 	id INTEGER NOT NULL UNIQUE PRIMARY KEY AUTO_INCREMENT,
// 	name TEXT NOT NULL,
// 	passwd TEXT NOT NULL,
// 	CoinBalance INTEGER NOT NULL,
// 	MoneyBalance INTEGER NOT NULL
// );

// CREATE TABLE wiseSaying (
// 	id  INTEGER NOT NULL AUTO_INCREMENT UNIQUE PRIMARY KEY,
// 	Author  TEXT NOT NULL,
// 	Message TEXT NOT NULL
// );

// INSERT INTO wiseSaying(Author, Message) VALUES('안중근', '내가 죽은 뒤에 나의 뼈를 하얼빈 공원 옆에 묻어 두었다가 나라를 되찾거든 고국으로 옮겨 다오. 나는 천국에 가서도 마땅히 우리나라의 독립을 위해 힘쓸 것이다. 대한 독립의 소리가 천국에 들려오면 나는 마땅히 춤추며 만세를 부를 것이다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('안중근', '이익을 보거든 정의를 생각하고, 위태로움을 보거든 목숨을 바쳐라.');
// INSERT INTO wiseSaying(Author, Message) VALUES('안창호', '진실은 반드시 따르는 자가 있고, 정의는 반드시 이루는 날이 있다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('이봉창 ', '인생의 목적이 쾌락이라면 지난 31년 동안에 쾌락이란 것을 대강 맛을 보았습니다. 이제부터는 영원한 쾌락을 위해서 독립 사업에 몸을 바칠 각오로 상해에 왔습니다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('김구 ', '우리 민족의 지나간 역사가 빛나지 아니함이 아니나, 그것은 아직 서곡이었다. 우리가 주연 배우로 세계 역사의 무대에 나서는 것은 오늘 이후다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('유관순 ', '나는 왜놈 따위에게 굴복하지 않는다! 언젠가 네놈들은 반드시 천벌을 받고 반드시 망하게 되리라!');
// INSERT INTO wiseSaying(Author, Message) VALUES('윤봉길 ', '죽음을 택해야 할 오직 한 번의 가장 좋은 기회를 포착했습니다. 백년을 살기보다 조국의 영광을 지키는 이 기회를 택했습니다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('조마리아 ', '집안 일은 생각하지 말고 최후까지 남자답게 싸워라.');
// INSERT INTO wiseSaying(Author, Message) VALUES('이범석 ', '한 말 배는 산산조각이 나고 몸은 갈기갈기 찢어지는 한이 있더라도 나의 혼과 정열은 한 방울의 피 한 점의 살이라도 내 사랑하는 조국 땅에 뿌려주고 던져 줄 것을 나는 확신한다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('강우규', '내가 죽어서 청년들의 가슴에 조그마한 충격이라도 줄 수 있다면 그것은 내가 소원하는 일이다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('김좌진 ', '할 일이... 할 일이 너무도 많은 이 때에 내가 죽어야 하다니, 그게 한스러워서...');
// INSERT INTO wiseSaying(Author, Message) VALUES('이상룡', '공자와 맹자는 나라를 되찾은 뒤 읽어도 늦지 않다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('신채호', '역사를 잊은 민족에게 미래는 없다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('유관순 ', '내 손톱이 빠져나가고, 내 귀와 코가 잘리고,  내 손과 다리가 부러져도 그 고통은 이길 수 있사오나,  나라를 잃어버린 그 고통만은 견딜 수가 없습니다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('윤봉길', '대장부는 집을 나가 뜻을 이루기 전에는  살아 돌아오지 않는다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('안중근', '나는 국민의 의무로서 내 몸을 희생하여  어진 일을 이루고자 했을 뿐이다.  내 이미 죽음을 각오하고 결행한 바이니  죽어도 여한이 없노라.');
// INSERT INTO wiseSaying(Author, Message) VALUES('김구', '눈길을 걸어갈 때 어지럽게 걷지 말기를,  오늘 내가 걸어간 길이   훗날 다른 사람의 이정표가 되리니');
// INSERT INTO wiseSaying(Author, Message) VALUES('유관순 ', '내 손과 다리가 부러져도 그 고통은 이길 수 있사오나  나라를 잃어버린 그 고통만은 견딜 수가 없습니다.  ​  나라에 바칠 목숨이 오직 하나밖에 없는 것만이  이 소녀의 유일한 슬픔입니다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('안중근 ', '뿌리 없는 나무가  어디에서 날 것이며,  ​  나라 없는 백성이  어디서 살 것인가');
// INSERT INTO wiseSaying(Author, Message) VALUES('안중근', '나를 죄인 취급하지 말아라.  ​  이토록 죽인 것은 나 일개인을 위한 것이 아닌  동양 평화를 위한 것이다.  ​  나는 독립군의 중장 자격으로 이토를 살해했다.  ​  나는 군인이다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('안창호', '나는 밥을 먹어도 대한의 독립을 위해  잠을 자도 대한의 독립을 위해 해왔다.  ​  이것은 내 목숨이 없어질 때까지 변함이 없을 것이다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('안창호', '낙망은 청년의 죽음이요,  청년이 죽으면 민족이 죽는다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('안창호', '견고한 기초 위에 좋은 건설이 있고,  튼튼한 뿌리 위에 좋은 꽃과 열매가 있다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('안창호', '자기 몸과 집을 자신이 다스리지 않으면  대신 다스려줄 사람이 없듯이  ​  자기 국가와 민족을 자신이 구하지 않으면  구해줄 사람이 없다는 것을 아는 것이  바로 책임감이요, 주인 관념이다.');
// INSERT INTO wiseSaying(Author, Message) VALUES('안창호', '그대는 매일 5분씩이라도  나라를 생각해 본 일이 있는가?');