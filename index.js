const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const SSLCommerzPayment = require('sslcommerz');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const ObjectId = require('mongodb').ObjectId;
const { v4: uuidv4 } = require('uuid');


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sztg1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/init/:amount', (req, res) => {
      const data = {
            total_amount: req.params.amount,
            currency: 'BDT',
            tran_id: 'REF123',
            success_url: 'http://localhost:5000/success',
            fail_url: 'http://localhost:5000/fail',
            cancel_url: 'http://localhost:5000/cancel',
            ipn_url: 'http://localhost:5000/ipn',
            shipping_method: 'Courier',
            product_name: 'Computer.',
            product_category: 'Electronic',
            product_profile: 'general',
            cus_name: 'Customer Name',
            cus_email: 'cust@yahoo.com',
            cus_add1: 'Dhaka',
            cus_add2: 'Dhaka',
            cus_city: 'Dhaka',
            cus_state: 'Dhaka',
            cus_postcode: '1000',
            cus_country: 'Bangladesh',
            cus_phone: '01711111111',
            cus_fax: '01711111111',
            ship_name: 'Customer Name',
            ship_add1: 'Dhaka',
            ship_add2: 'Dhaka',
            ship_city: 'Dhaka',
            ship_state: 'Dhaka',
            ship_postcode: 1000,
            ship_country: 'Bangladesh',
            multi_card_name: 'mastercard',
            value_a: 'ref001_A',
            value_b: 'ref002_B',
            value_c: 'ref003_C',
            value_d: 'ref004_D'
      };
      const sslcommer = new SSLCommerzPayment('testbox', 'qwerty', false) //true for live default false for sandbox
      sslcommer.init(data).then(data => {
            //process the response that got from sslcommerz 
            //https://d...content-available-to-author-only...z.com/doc/v4/#returned-parameters
            // console.log(data)
            res.redirect(data.GatewayPageURL)
      });
})
 
app.post("/success", async (req, res) => {
 
      console.log(req.body)
      res.status(200).json(req.body)
 
})
app.post("/fail", async (req, res) => {
 
      console.log(req.body)
      res.status(400).json(req.body)
 
})
app.post("/cancel", async (req, res) => {
 
      console.log(req.body)
      res.status(200).json(req.body)
 
})
async function run() {
    try {
        await client.connect();
        console.log("database connection succesfully");
        const database = client.db("ParkBook");
        const userCollection = database.collection("Users");
        const slotCollection = database.collection("ParkingSlots");
        const orderCollection = database.collection("Orders");
        const paymentCollection = database.collection("PaymentCollection");

        //-----GET API-----//

        // Get all Slots 
        app.get("/allSlots", async (req, res) => {
            const cursor = slotCollection.find({});
            const slots = await cursor.toArray();
            res.send(slots);
        });

        app.get('/allSlots/:DueTime/:ParkingZone', async (req, res) => {
            const DueTime = req.params.DueTime;
            const ParkingZone = req.params.ParkingZone;
            let query = {};
            if (ParkingZone != "None") {
                query = {
                    "$and": [{
                        "ParkingZone": ParkingZone
                    }, {
                        "$or": [{
                            "DueTime": { "$lt": parseInt(DueTime) }
                        }, {
                            "DueTime": ""
                        }]
                    }]
                }
            }
            else {
                query = {
                    "$or": [{
                        "DueTime": { "$lt": parseInt(DueTime) }
                    }, {
                        "DueTime": ""
                    }]
                }
            }

            const cursor = slotCollection.find(query);
            const slots = await cursor.toArray();

            res.send(slots);
        });

        // Get all users 
        app.get("/allusers", async (req, res) => {
            const cursor = userCollection.find({});
            const users = await cursor.toArray();
            res.send(users);
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        // Get all orders 
        app.get("/allorders", async (req, res) => {
            const cursor = orderCollection.find({});
            const orders = await cursor.toArray();
            res.send(orders);
        });


        //-----POST API-----//

        // add User API
        app.post('/adduser', async (req, res) => {
            const result = await userCollection.insertOne(req.body);
            res.json(result);
        });


        // add Order API
        app.post('/addorder', async (req, res) => {
            const result = await orderCollection.insertOne(req.body);
            res.json(result);
        });


        //-----UPDATE API-----//


        // UPSERT User API
        app.put('/adduser', async (req, res) => {
            const user = req.body;
            console.log(user);
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        // UPSERT Admin API
        app.put('/adduser/makeadmin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc =
            {
                $set: {
                    role: 'admin'
                }
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        // UPSERT Slot API
        app.put('/allSlots/makeAvailable', async (req, res) => {
            const id = req.body;
            console.log(id.slotID)
            const filter = { _id: ObjectId(id.slotID) };
            const updateDoc =
            {
                $set: {

                    DueTime: 0.00
                }
            };
            const result = await slotCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        app.put('/allSlots/makeUnavailable', async (req, res) => {
            const slot = req.body;
            // console.log(slot.DepTime, slot.slotID);
            const filter = { _id: ObjectId(slot.slotID) };
            const updateDoc =
            {
                $set: {

                    DueTime: parseFloat(slot.DepTime)
                }
            };
            const result = await slotCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        //-----DELETE API-----//

        // Delete Single Order by ID
        app.delete('/allorders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.json(result);
        });

        // payment ssl
//         app.get('/init', (req, res) => {
//     const data = {
//         total_amount: 100,
//         currency: 'BDT',
//         tran_id: 'REF123',
//         success_url: 'http://yoursite.com/success',
//         fail_url: 'http://yoursite.com/fail',
//         cancel_url: 'http://yoursite.com/cancel',
//         ipn_url: 'http://yoursite.com/ipn',
//         shipping_method: 'Courier',
//         product_name: 'Computer.',
//         product_category: 'Electronic',
//         product_profile: 'general',
//         cus_name: 'Customer Name',
//         cus_email: 'cust@yahoo.com',
//         cus_add1: 'Dhaka',
//         cus_add2: 'Dhaka',
//         cus_city: 'Dhaka',
//         cus_state: 'Dhaka',
//         cus_postcode: '1000',
//         cus_country: 'Bangladesh',
//         cus_phone: '01711111111',
//         cus_fax: '01711111111',
//         ship_name: 'Customer Name',
//         ship_add1: 'Dhaka',
//         ship_add2: 'Dhaka',
//         ship_city: 'Dhaka',
//         ship_state: 'Dhaka',
//         ship_postcode: 1000,
//         ship_country: 'Bangladesh',
//         multi_card_name: 'mastercard',
//         value_a: 'ref001_A',
//         value_b: 'ref002_B',
//         value_c: 'ref003_C',
//         value_d: 'ref004_D'
//     };
//     const sslcommer = new SSLCommerzPayment('testbox', 'qwerty',false) //true for live default false for sandbox
//     sslcommer.init(data).then(data => {
//         //process the response that got from sslcommerz 
//         //https://developer.sslcommerz.com/doc/v4/#returned-parameters
//         res.redirect(data.GatewayPageURL)
//     });
// })
// payment sucess



    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {

    res.send("API is running");

});



app.listen(port, () => {
    console.log(`My Server listening at http://localhost:${port}`)
})