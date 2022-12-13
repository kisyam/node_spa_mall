const mongoose = require("mongoose");
mongoose.set('strictQuery', true);

const connect = () => {
    mongoose
        .connect("mongodb://localhost:27017/spa_mall") // mongodb 연결
        .catch(err => console.log(err)); // 에러 처리
};

mongoose.connection.on("error", err => { // 에러를 어떻게 처리하는지
    console.error("몽고디비 연결 에러", err);
});

module.exports = connect;