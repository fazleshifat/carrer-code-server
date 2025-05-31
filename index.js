const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());

// connecting to MongoDB Database


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.knw8z6m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        const jobsCollection = client.db("careerDB").collection("jobs")
        const applicationsCollection = client.db("careerDB").collection("applications")

        // jwt token related api 
        app.post('/jwt', async (req, res) => {
            const { email } = req.body;
            const user = { email };
            const token = jwt.sign(user, 'secret', { expiresIn: '1h' });
            res.send({ token });
        })

        // job application related APIs
        app.post('/applications', async (req, res) => {
            const application = req.body;
            const result = await applicationsCollection.insertOne(application);
            res.send(result);
        })

        app.get('/applications', async (req, res) => {
            const email = req.query.email

            query = {}

            if (email) {
                query.applicant = email
            }

            const result = await applicationsCollection.find(query).toArray()


            // bad way to aggregate data
            for (const application of result) {
                const jobId = application.jobId
                const jobQuery = { _id: new ObjectId(jobId) }
                const job = await jobsCollection.findOne(jobQuery);
                // application.company = job.companyTitle;
                // application.title = job.title;
                // application.company_logo = job.company_logo;

            }


            res.send(result)
        })

        app.get('/applications/job/:job_id', async (req, res) => {
            const job_id = req.params.job_id;
            const query = { jobId: job_id };
            const result = await applicationsCollection.find(query).toArray();
            res.send(result);
        })

        app.patch('/applications/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: req.body.status
                }
            }

            const result = await applicationsCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })



        // all jobs api
        app.get('/jobs', async (req, res) => {
            const email = req.query.email;
            query = {}

            if (email) {
                query.hr_email = email;
            }

            const cursor = jobsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await jobsCollection.findOne(query)

            res.send(result)

        })

        app.post('/jobs', async (req, res) => {
            const newJob = req.body;
            const result = await jobsCollection.insertOne(newJob);
            res.send(result);

        })





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
    res.send('Career code is cooking')
})

app.listen(port, () => {
    console.log(`Career code server is running on port ${port}`)
})