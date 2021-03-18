import express from 'express';
import {debug} from '../utils/logger.js';
import {Data} from '../utils/data.js';


var router = express.Router();

//common routes for all requests

router.use(function (req, res, next) {
  debug("request URL",req.get('host'), req.method, req.originalUrl);
  next();
})

export { router};