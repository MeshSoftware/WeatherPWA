"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const maps = require("@google/maps");
const axios_1 = require("axios");
const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: true }));
app.get('/forecast/:lat/:lon/', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const url = `https://api.darksky.net/forecast/${functions.config().darksky.secret}/${req.params.lat},${req.params.lon}?exclude=minutely,hourly,flags`;
    //console.log('DarkSky URL: ', url);
    axios_1.default.get(url)
        .then(response => {
        //console.log('DarkSky Data: ', response.data);
        res.status(200).send(response.data);
    })
        .catch(error => {
        //console.log('DarkSky Error: ', error);
        res.status(500).send(error);
    });
}));
app.get('/geocoding/:location/', (req, res) => __awaiter(this, void 0, void 0, function* () {
    let mapClient = maps.createClient({
        key: functions.config().maps.key,
        Promise: Promise
    });
    mapClient.geocode({
        address: req.params.location,
        components: {
            country: 'US',
            postal_code: req.params.location
        }
    }).asPromise()
        .then(response => {
        console.log('Maps Data: ', response.json.results);
        res.status(200).send(response.json.results);
    })
        .catch(error => {
        console.log('Maps Error: ', error);
        res.status(500).send(error);
    });
}));
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map