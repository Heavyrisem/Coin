const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');

const sqlite3 = require('sqlite3').verbose();
const DB = new sqlite3.Database('./DB.db', sqlite3.OPEN_READWRITE, err => {
    if (err) {
        console.log(`Error while Opening DB ${err}`);
    } else {
        console.log(`Database Connected`);
    }
});

app.use(require('cors')());
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));



const PORT = 3002;
const UpdateTick = 2500;
const MinimumCoinValue = 10000;
const DefaultCoinValue = 100000;
const MaximunCoinValue = 450000;
let coinvalue = 0;


io.on("connection", client => {

    console.log(`${client.id} 님이 접속했습니다.`);


    client.on("login", (data) => {
        if (data) {
            DB.get("SELECT * FROM userinfo WHERE name='${data.name}'", (err, row) => {
                console.log(row);
            });
        }
    })



    client.on("disconnect", () => {
        console.log(`${client.id} 님이 접속을 종료했습니다.`)
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
            rand = Math.abs(Math.sin(coinvalue) * RandomData(13, 51) * 20);
            type = "sin";
            break;
        }
        case 1: {
            rand = Math.abs(Math.tan(coinvalue) * RandomData(8, 11) * 20);
            type = "tan";
            break;
        }
    }
    console.log("\n조정 전", rand);
    if (!nextDir) {
        if (coinvalue >= MaximunCoinValue / 3) { rand *= 1; } // 상한선의 1/3 이상일때, 100% 감소
        else {rand *= 0.7; console.log("하락율 30% 감소")} // 1/3 미만일 경우 30% 감소
        if (coinvalue >= MaximunCoinValue - MaximunCoinValue / 3) { rand *= 1.5; console.log("하락율 50% 증가") } // 상한선의 2/3 이상일때 130%감소
        if (coinvalue <= DefaultCoinValue) { rand = rand * 0.1; console.log("하락율 900% 감소") }
        //  {rand *= 0.5;console.log("하락율 50% 감소")} //상한선의 1/3 이하일때, 50% 감소후 하락
        rand *= -1;
    } else {
        if (coinvalue >= MaximunCoinValue / 3) { rand *= 1; } //상한선의 1/3 이상일때, 100% 증가
        else {rand *= 1.3; console.log("상승률 130% 증가")} // 1/3 미만일 경우 130% 증가
        if (coinvalue <= DefaultCoinValue) { rand *= 5; console.log("상승율 500% 증가") } //기본가격보다 낮을때 30% 추가
        if (coinvalue >= MaximunCoinValue - MaximunCoinValue / 3) { rand *= 0.7; console.log("상승율 30% 감소") } // 상한선의 2/3 이상일때 70% 증가
        //  {rand *= 1.5;console.log("상승율 150% 증가")} //상한선의 1/3 이하일때, 20% 추가후 증가
    }

    console.log("조정 후", rand);

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



app.post("/login", (req, res) => {
    DB.get(`SELECT * FROM userinfo WHERE name=${req.body.id}`, (err, row) => {
        if (err) return console.log(err);
        if (row) {
            if (row.passwd == req.body.passwd)
                res.send({ id: row.name, CoinBalance: row.CoinBalance, MoneyBalance: row.MoneyBalance });
            else res.send({msg: "WRONG_PASSWD"});
        } else {
            res.send({msg: "NO_USER"});
        }
    })
});

app.post("/register", (req, res) => {
    DB.get(`SELECT * FROM userinfo WHERE name=${req.body.id}`, (err, row) => {
        if (err) return console.log(err);
        if (row) {
            return res.send({msg: "USER_EXISTS"});
        } else {
            DB.run(`INSERT INTO userinfo(name, passwd, CoinBalance, MoneyBalance) VALUES("${req.body.id}", "${req.body.passwd}", "100", "300000")`, (err, row) => {
                if (err) return console.log(err);
                return res.send({id: req.body.id});
            })
        }
    })
});



server.listen(PORT, () => {
    DB.get("SELECT * FROM coinValue where id=(SELECT MAX(id) FROM coinValue)", (err, row) => {
        if (err) return console.log("Error while Get Last Value", err);

        if (row) {
            coinvalue = row.value;
        } else {
            console.log("Loading Default CoinValue");
            coinvalue = DefaultCoinValue;
        }
        calculateCoinValue();
    })
});