const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
require("dotenv").config();
app.use(cors());
app.use(express.json());
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

function AuthorizatonJWt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    console.log("decoded", decoded);
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_Fruits}:${process.env.DB_PASS}@cluster0.g0slb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

  async function run() {
    try {
      await client.connect();
      const fruitsCollection = client.db("fruits1").collection("products");
      app.post("/login", async (req, res) => {
        const user = req.body;
        console.log(user);
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "1d",
        });
        res.send({ accessToken });
      });

      app.get("/fruit", async (req, res) => {
        const query = {};
        const cursor = fruitsCollection.find(query);
        const fruits = await cursor.toArray();
        res.send(fruits);
      });

      app.get("/fruit/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const fruit = await fruitsCollection.findOne(query);
        res.send(fruit);
      });

      app.put("/fruit/:id", async (req, res) => {
        const id = req.params.id;
        const updateQuantity = req.body;
        console.log(updateQuantity);
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updatedDoc = {
          $set: {
            quantity: updateQuantity.newQuantity,
          },
        };
        const results = await fruitsCollection.updateOne(
          filter,
          updatedDoc,
          options
        );
        res.send(results);
      });
      app.delete("/fruit/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await fruitsCollection.deleteOne(query);
        res.send(result);
      });

      // post
      app.post("/fruit", async (req, res) => {
        const newItem = req.body;
        const result = await fruitsCollection.insertOne(newItem);
        res.send(result);
      });

      app.get("/myItem", AuthorizatonJWt, async (req, res) => {
        const decodedEmail = req.decoded.email;
        const email = req.query.email;
        if (email === decodedEmail) {
          const query = { email: email };
          const cursor = fruitsCollection.find(query);
          const orders = await cursor.toArray();
          res.send(orders);
        } else {
          res.status(403).send({ message: "Forbidden access" });
        }
      });
    } finally {
    }
  }
  run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("fruits server warehouse");
});

app.listen(port, () => {
  console.log("My warehouse management system", port);
});
