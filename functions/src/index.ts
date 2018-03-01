import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';
import * as maps from '@google/maps';
import axios from 'axios';

const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: true }));

app.get('/forecast/:lat/:lon/', async (req: express.Request, res: express.Response) => {

	const url = `https://api.darksky.net/forecast/${functions.config().darksky.secret}/${req.params.lat},${req.params.lon}?exclude=minutely,hourly,flags`;

	//console.log('DarkSky URL: ', url);

	axios.get(url)
		.then(response => {
			//console.log('DarkSky Data: ', response.data);
			res.status(200).send(response.data);
		})
		.catch(error => {
			//console.log('DarkSky Error: ', error);
			res.status(500).send(error);
		});
});

app.get('/geocoding/:location/', async (req: express.Request, res: express.Response) => {

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
});

exports.api = functions.https.onRequest(app);

