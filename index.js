const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ssehx4e.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
    try {
        await client.connect();
        const inventoriesCollection = client.db("easyStock").collection("inventories");

        // Authentication by JWT

        app.post("/login", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN, {
                expiresIn: "1d",
            });
            res.send({ token });
        });

        // get inventories from mongo database
        app.get("/inventories", async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const cursor = inventoriesCollection.find({}).sort({ _id: -1 });

            let items;

            if (page || size) {
                items = await cursor
                    .skip(page * size)
                    .limit(size)
                    .toArray();
            } else {
                items = await cursor.toArray();
            }

            res.send(items);
        });

        // counts total number of items
        app.get("/numberOfItems", async (req, res) => {
            const count = await inventoriesCollection.estimatedDocumentCount({});
            res.json({ count });
        });

        // get my inventories filter by email
        app.get("/myInventories", jwtVerify, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;

            if (decodedEmail === email) {
                const query = { email };
                const cursor = inventoriesCollection.find(query).sort({ _id: -1 });
                const inventories = await cursor.toArray();
                res.send(inventories);
            } else {
                res.status(403).send({ message: "Error 403 - Forbidden" });
            }
        });

        
    } finally {
        // await client.close();
    }
};
run().catch(console.dir);

app.get("/", (req, res) => res.send("easyStock server is running.."));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
