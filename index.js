const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const objectId = require('mongodb').ObjectId
const fileUpload = require('express-fileupload');
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e2egq.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`

const port = process.env.PORT || 5000;

const app = express()

app.use(bodyParser.json());
app.use(cors())
app.use(express.static('doctors'));
app.use(fileUpload());

app.get('/', (req, res) => {
    res.send("hello from db it's working")
})



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const appointmentCollection = client.db("doctorsPortal").collection("appointment");
    const doctorCollection = client.db("doctorsPortal").collection("doctors");

    app.post('/addAppointment', (req, res) => {
        const appointment = req.body
        appointmentCollection.insertOne(appointment)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    });

    app.post('/appointmentsByDate', (req, res) => {
        const date = req.body.date
        const email = req.body.email;
        console.log(date, email);

        doctorCollection.find({ email: email })
            .toArray((error, doctor) => {
                const filter = { date: date }
                if (doctor.length === 0) {
                    filter.email = email
                }
                appointmentCollection.find(filter)
                    .toArray((err, documents) => {
                        res.send(documents)
                    })
            })


    });

    app.get('/appointments', (req, res) => {
        appointmentCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })



    app.post('/addADoctor', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        doctorCollection.insertOne({ name, email, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.get('/doctors', (req, res) => {
        doctorCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    app.delete('/deleteDoctor/:id', (req, res) => {
        doctorCollection.deleteOne({_id: objectId(req.params.id)})
        .then(result => {
            res.send(result.deletedCount > 0)
        })
    })


});


app.listen(process.env.PORT || port)