const express = require("express");
const mongoose = require("mongoose");
const Joi = require("joi"); //Schema 필드 제약 걸기
const jwt = require("jsonwebtoken"); // 암호 토큰 생성
const User = require("./models/user");
const Goods = require("./models/goods");
const Cart = require("./models/cart");
const authMiddleware = require("./middlewares/auth-middleware"); // 인증 미들웨어(auth)

mongoose.set("strictQuery", true); //mongoose version 7 error handle
mongoose.connect("mongodb://localhost/shopping-demo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();

const postUsersSchema = Joi.object({
  nickname: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  confirmPassword: Joi.string().required(),
});

router.post("/users", async (req, res) => {
  try {
    const { nickname, email, password, confirmPassword } =
      await postUsersSchema.validateAsync(req.body);

    if (password !== confirmPassword) {
      res.status(400).send({
        errorMessage: "패스워드가 일치하지 않습니다.",
      });
      return;
    }

    const existUsers = await User.find({
      $or: [{ email }, { nickname }],
    });

    if (existUsers.length > 0) {
      res.status(400).send({
        errorMessage: "이미 가입된 이메일 또는 닉네임입니다.",
      });
      return;
    }

    const user = new User({ email, nickname, password });
    await user.save();

    res.status(201).send({});

  } catch (err) {
    console.log(err);
    res.status(400).send({
      errorMessage: "요청한 데이터 형식이 올바르지 않습니다.",
    });
  }
});


const postAuthSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});


router.post("/auth", async (req, res) => {
  try {
    const { email, password } = await postAuthSchema.validateAsync(req.body);
  
    const user = await User.findOne({ email, password }).exec();
  
    if (!user) {
      res.status(400).send({
        errorMessage: "이메일 또는 패스워드가 잘못되었습니다.",
      });
      return;
    }
  
    const token = jwt.sign({ userId: user.userId }, "my-secret-key");
    res.send({
      token,
    });
  } catch(err){
    console.log(err);
    res.status(400).send({
      errorMessage:"요청한 데이터 형식이 올바르지 않습니다.",
    });
  }
});

router.get("/users/me", authMiddleware, async (req, res) => {
  const { user } = res.locals;
  res.send({
    user,
  });
});

// 내가 가진 장바구니 목록을 전부 불러온다.
router.get("/goods/cart", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;

  const cart = await Cart.find({
    userId,
  }).exec();

  const goodsIds = cart.map((c) => c.goodsId);

  //루프 줄이기 위해 Mapping 가능한 객체로 만든 것
  const goodskeyById = await Goods.find({
    _id: { $in: goodsId },
  })
    .exec()
    .then((goods) =>
      goods.reduce(
        (prev, g) => ({
          ...prev,
          [g.goodsId]: g,
        }),
        {}
      )
    );
  res.send({
    cart: cart.map((c) => ({
      quantity: c.quantity,
      goods: goodskeyById[c.goodsId],
    })),
  });
});

// 장바구니에 상품 담기.
// 장바구니에 상품이 이미 담겨 있으면 갯수만 수정한다.
router.put("/goods/:goodsId/cart", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { goodsId } = req.params;
  const { quantity } = req.body;

  const existsCart = await Cart.findOne({
    userId,
    goodsId,
  }).exec();

  if (existsCart) {
    existsCart.quantity = quantity;
    await existsCart.save();
  } else {
    const cart = new Cart({
      userId,
      goodsId,
      quantity,
    });
    await cart.save();
  }

  //NOTE: 성공했을 때 응답 값을 클라이언트가 사용하지 않는다.
  res.send({});
});

// 장바구니 항목 삭제
router.delete("/goods/:goodsId/cart", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { goodsId } = req.params;

  const existsCart = await Cart.findOne({
    userId,
    goodsId,
  }).exec();

  // 있든 말든 신경 안쓴다. 그냥 있으면 지운다.
  if (existsCart) {
    existsCart.delete();
  }
  //NOTE: 성공했을 때 딱히 정해진 응답 값이 없다.
  res.send({});
});

// 모든 상품 가져오기
router.get("/goods", authMiddleware, async (req, res) => {
  const { category } = req.query;
  const goods = await Goods.find(category ? { category } : undefined)
    .sort("-date")
    .exec();

  res.send({ goods });
});

// 상품 하나만 가져오기
router.get("/goods/:goodsId", authMiddleware, async (req, res) => {
  const { goodsId } = req.params;
  const goods = await Goods.findById(goodsId).exec();

  if (!goods) {
    res.status(400).send({});
  } else {
    res.send({ goods });
  }
});

app.use("/api", express.urlencoded({ extended: false }), router);
app.use(express.static("assets"));

app.listen(8080, () => {
  console.log("서버가 연결되었습니다.");
});
