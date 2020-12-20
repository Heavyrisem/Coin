function RandomToken(length) {
    let result = "";


    const min = 97;
    const max = 122;
    for (var i = 0; i < length; i++) {
        switch (Math.floor(Math.random() * 3)) {
            case 0: {
                result += String.fromCharCode(Math.floor(Math.random() * (max - min) + min));
                break;
            }
            case 1: {
                result += String.fromCharCode(Math.floor(Math.random() * (max - min) + min)).toUpperCase();
                break;
            }
            case 2: {
                result += Math.floor(Math.random() * 10) + "";
                break;
            }
        }
    }

    return result;
}
module.exports = RandomToken;
// alskdjfkej
// alskd jfkej


// // 중복 확률 테스트
// let tot = 500;
// let loop = 0;
// let last = [];
// let acc = [];
// for (var i = 0; i < tot; i++) {

//     while (1) {
//         loop++;
//         let tmp = RandomToken();
//         if (last.indexOf(tmp) != -1) {
//             acc.push(1/loop*100);
//             // console.log(1/loop*100);
//             break;
//         } else {
//             last.push(tmp);
//         }
//     }
//     console.log(`${i} 번째 루프`);
// }
// {
//     let tmp = 0;
//     acc.forEach(ac => {
//         tmp += ac;
//     });
//     console.log(`중복 확률 ${tmp/tot}%`);
// }