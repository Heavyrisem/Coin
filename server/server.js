const server = require('http').createServer();
const io = require('socket.io')(server, {cors:{origin: "*",methods: ["GET", "POST"]}});
const PORT = 3002;
let coinvalue = 201;

io.on("connection", client => {
    
    console.log(`${client.id} 님이 접속했습니다.`);
    
    client.on("disconnect", () => {
        console.log(`${client.id} 님이 접속을 종료했습니다.`)
    });
    

});

function calculateCoinValue() {
    
    let rand = 0;
    switch (RandomData(0, 2)) {
        case 0: {
            rand = (Math.sin(coinvalue * 2) * RandomData(3.3, 11.1) * 10);
        }
        case 1: {
            rand = (Math.tan(coinvalue * 2) * RandomData(3.3, 11.1) * 10);
        }
    }
    
    if (isNaN(rand)) return;
    // console.log(rand);
    
    rand += parseFloat(coinvalue);
    rand = parseFloat(rand).toFixed(5)
    if (rand < 1) rand = 1500;
    coinvalue = rand;

    io.emit("CoinValue", coinvalue)
    setTimeout(calculateCoinValue, 100);
}

function RandomData(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

calculateCoinValue();
server.listen(PORT);