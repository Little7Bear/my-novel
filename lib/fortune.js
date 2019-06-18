const fortuneCookies = [
    "小孩子才做选择，大人全都要。",
    "忘仔牛奶：喝了这瓶奶，忘了那个仔。",
    "NMSL--Never Mind the Scandal and Liber",
    "好吃不过饺子，好玩不过嫂子。",
    "蛤？",
];

exports.getFortune = function () {
    let idx = Math.floor(Math.random() * fortuneCookies.length);
    return fortuneCookies[idx];
};