import express from 'express';
import 'dotenv/config';
import connect from './config/db.js';
import AdminRoute from './routes/admin.routes.js';

connect();
let app = express();
app.use(express.json());
app.use('/api/installation',AdminRoute);

app.listen(process.env.PORT, () => {
    console.log(`test : ${process.env.PORT}`)
});