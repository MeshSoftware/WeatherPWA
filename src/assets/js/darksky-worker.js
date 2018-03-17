
let location = {
	latitude: '',
	longitude: ''
};

self.addEventListener('message', function (e) {

	let data = e.data;

	switch (data.command) {
		case 'start':
			domain = data.domain;
			self.start(1);
			self.postMessage('WORKER STARTED');
			break;

		case 'stop':
			self.stop();
			self.postMessage('WORKER STOPPED');
			break;

		case 'poll':
			self.poll();
			break;

		default:
			self.postMessage('Unknown Command');
	};
}, false);

function getForecast() {

	let forecastUrl = `https://us-central1-weatherpwa-4a551.cloudfunctions.net/api/forecast/${location.latitude}/${location.longitude}/`;

}