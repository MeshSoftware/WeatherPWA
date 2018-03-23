importScripts(
	'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.19.1/moment.min.js'
);

let timer = null;

let location = {
	latitude: '',
	longitude: ''
};

let interval = 30;
let lastTime = moment();

self.addEventListener('message', function (e) {

	let data = e.data;

	switch (data.command) {
		case 'start':
			location = data.location;	
			interval = data.interval;
			self.start();
			break;

		case 'stop':
			self.stop();
			break;

		case 'poll':
			self.poll();
			break;
		
		case 'interval':
			interval = data.interval;
			break;	

		default:
			self.postMessage('Unknown Command');
	};
}, false);

self.start = () => {

	let timer = setInterval(() => {

		let nextTime = lastTime.add(interval, 'm');

		if (nextTime.isSame(moment(), 'minute')) {
			self.poll();
		}

	}, 30 * 1000);

	self.poll();
};

self.stop = () => {
	timer.clear();
};

self.poll = () => {

	let timestamp = new Date().getTime();
	let url = `https://us-central1-weatherpwa-4a551.cloudfunctions.net/api/forecast/${location.latitude}/${location.longitude}/?no-cache=${timestamp}`;

	lastTime = moment();

	fetch(url)
		.then(response => {
			return response.json();
		})
		.then(json => {
			self.postMessage(json);
		})
		.catch(error => {
			console.log('Fetch API Error: ', error);
		});
};
