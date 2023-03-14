import express from 'express';
import videoController from '../controllers/shell.controller.js';

const uploadRoute = express.Router();
uploadRoute.post('/upload',videoController.uploadAndConvert);

export default uploadRoute;
