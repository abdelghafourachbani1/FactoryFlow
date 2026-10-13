import 'dotenv/config';
import connect from './config/db.js';
import AdminRoute from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import matierPrRoutes from './routes/matierPr.routes.js';
import productRoutes from './routes/product.routes.js';

connect();
let app = express();
app.use(express.json());
app.use('/api/installation',AdminRoute);
app.use('/api/auth', authRoutes);
app.use('/api/matierPr', matierPrRoutes);
app.use('/api/products', productRoutes);

app.listen(process.env.PORT, () => {
    console.log(`test : ${process.env.PORT}`)
});