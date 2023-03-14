import express from 'express';
import fs from 'fs';
import uploadRoute from './src/routes/shell.route.js';
const app = express();

app.use('/',uploadRoute);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const uploadDir = 'videos/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}


const port = 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
