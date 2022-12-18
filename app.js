const express = require('express');
const app = express();
const port = 3000;

const goodsRouter = require("./routes/goods.js") //goods.js에 있는 라우터를 반환 받음.
const cartsRouter = require("./routes/carts.js")

const connect = require("./schemas");
connect();


// app.post("/",(req,res)=>{
//     console.log(req.body);

//     res.send("기본 URI에 POST 메소드가 정상적으로 실행되었습니다.")
// })

// app.get("/", (req,res) =>{
//     console.log(req.query);

//     const obj = {
//         "keykey" : "value 입니다",
//         "이름입니다" : "이름일까요?"
//     }

//     res.json(obj);
// })

// app.get("/:id", (req,res) => {
//     console.log(req.params);

//     res.send(":id URI 에 정상적으로 반환되었습니다.")
// })
// app.get('/', (req, res) => {
//   res.send('Hello World!');
// });


app.use(express.json());

//localhost:3000/api -> goodRouter
app.use("/api", [goodsRouter, cartsRouter]); //전역 미들웨어

app.get("/", (req,res) => {
  res.send("Hello World!");
})

app.listen(port, () => {
  console.log(port, '포트로 서버가 열렸어요!');
});