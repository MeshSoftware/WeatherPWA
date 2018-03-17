import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import * as maps from '@google/maps';
import * as moment from 'moment';

import axios from 'axios';

const SHARD_COUNT = 10;

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();
const app = express();

const dayKey = moment().utc().format('YYYYMMDD');

// Distributed Counters
// Ref: https://firebase.google.com/docs/firestore/solutions/counters

const createCounter = (api) => {

	const batch = admin.firestore().batch();
	const keyRef = db.doc(`counters/${api}/counts/${dayKey}`);

	batch.set(keyRef, { date: dayKey });

	// Initialize each shard with count=0
	for (let i = 0; i < SHARD_COUNT; i++) {
		const shardRef = keyRef.collection('shards').doc(i.toString());
		batch.set(shardRef, { count: 0 });
	}

	// Commit the write batch
	return batch.commit();
};

const getCount = (api) => {

	return new Promise((resolve, reject) => {

		const keyRef = db.doc(`counters/${api}/counts/${dayKey}`);

		keyRef.get()
			.then(keyDoc => {
				if (!keyDoc.exists) {
					createCounter(api)
						.then(result => {
							resolve(0);
						})
						.catch(err => {
							console.log('Error Creating Counter', err);
							reject(err);
						});
				}
				else {
					// Sum the count of each shard in the subcollection
					db.collection(`counters/${api}/counts/${dayKey}/shards/`).get()
						.then(shards => {

							let totalCount = 0;

							shards.forEach(doc => {
								totalCount += doc.data().count;
							});

							resolve(totalCount);
						})
						.catch(err => {
							console.log('Error Summing Counter', err);
							reject(err);
						});
				}
			})
			.catch(err => {
				console.log('Error Getting Counter Key', err);
				reject(err);
			});
	});
};

const incrementCounter = (api) => {

	const shardId = Math.floor(Math.random() * SHARD_COUNT).toString();
	const shardRef = db.collection(`counters/${api}/counts/${dayKey}/shards/`).doc(shardId);

	// Update count in a transaction
	return db.runTransaction(t => {
		return t.get(shardRef).then(doc => {
			const newCount = doc.data().count + 1;
			t.update(shardRef, { count: newCount });
		});
	});
};

app.disable('x-powered-by');
app.use(cors({ origin: true }));

app.get('/forecast/:lat/:lon/', async (req: express.Request, res: express.Response) => {

	const api = 'api.darksky.net';
	const url = `https://${api}/forecast/${functions.config().darksky.secret}/${req.params.lat},${req.params.lon}?exclude=minutely,hourly,flags`;

	const count = await getCount(api);

	console.log(`${api} ${dayKey} Request Count:`, count);

	if (count < 950) {

		await incrementCounter(api);

		axios.get(url)
			.then(response => {
				//console.log('DarkSky Data: ', response.data);
				res.status(200).send(response.data);
			})
			.catch(error => {
				//console.log('DarkSky Error: ', error);
				res.status(500).send(error);
			});
	}
	else {
		res.status(500).send('DarkSky Daily Limit Reached');
	}
});

app.get('/geocoding/:location/', async (req: express.Request, res: express.Response) => {

	const api = 'geocoding.google.maps';

	const count = await getCount(api);

	console.log(`${api} ${dayKey} Request Count:`, count);

	if (count < 2450) {

		await incrementCounter(api);

		const mapClient = maps.createClient({
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
				//console.log('Maps Data: ', response.json.results);
				res.status(200).send(response.json.results);
			})
			.catch(error => {
				//console.log('Maps Error: ', error);
				res.status(500).send(error);
			});
	}
	else {
		res.status(500).send('Google Maps Daily Limit Reached');
	}
});

exports.api = functions.https.onRequest(app);

