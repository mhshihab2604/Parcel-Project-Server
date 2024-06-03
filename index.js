const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t1zteu1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const usersCollection = client.db('parcelDB').collection('users')
    const parcelCollection = client.db('parcelDB').collection('parcel')

    const isValidObjectId = (id) => {
      return ObjectId.isValid(id) && (String(new ObjectId(id)) === id);
    };

    app.put('/users', async (req, res) => {
        const user = req.body
        const query = { email: user?.email }
        const isExist = await usersCollection.findOne(query)
        if (isExist) return res.send(isExist)

        // save user for the first time
        const options = { upsert: true}
        const updateDoc = {
            $set: {
                ...user,
            },
        }
        const result = await usersCollection.updateOne(query, updateDoc, options)
        res.send(result)
    })

    // get a user info by email from db
    app.get('/user/:email', async (req, res) => {
        const email = req.params.email
        const result = await usersCollection.findOne({ email })
        res.send(result)
      })

    // get all users from db
    app.get('/users', async (req, res) =>{
        const result = await usersCollection.find().toArray()
        res.send(result)
    })


    // Parcel Station
    app.get('/parcel', async (req, res) => {
      const result = await parcelCollection.find().toArray();
      res.send(result);
    });

    app.get('/parcel/g/:id', async (req, res) => {
      const id = req.params.id;
      if (!isValidObjectId(id)) {
          return res.status(400).send({ error: 'Invalid ID format' });
      }
      const query = { _id: new ObjectId(id) };
      const result = await parcelCollection.findOne(query);
      res.send(result);
    });

    app.get(`/parcel/:email`, async (req, res) => {
      const email = req.params.email;
      const query = { email: email}
      const result = await parcelCollection.find(query).toArray();
      res.send(result);
    })

    // Book A Parcel
    app.post('/parcel', async (req, res) => {
      const item = req.body;
      const result = await parcelCollection.insertOne(item);
      res.send(result);
    })

    // --------Delete Booking Parcel ---------
    app.delete("/parcel/:id", async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await parcelCollection.deleteOne(query);
      res.send(result)
    });

    
    app.patch('/parcel/:id', async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      if (!isValidObjectId(id)) {
          return res.status(400).send({ error: 'Invalid ID format' });
      }
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
          $set: {
            ...item
          }
      };
      const result = await parcelCollection.updateOne(filter, updateDoc);
      res.send(result);
  });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Parcel is on the way')
})

app.listen(port, () => {
    console.log(`Parcel is running on the port: ${port}`);
})