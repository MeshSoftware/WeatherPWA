import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Forecast, Conditions } from './forecast';
import { DateTime } from 'luxon';
export class Location {

	name: string;
	zip: string;
	latitude: string;
	longitude: string;
	interval: number;

	forecast: Observable<Forecast>;

	private worker: Worker;
	private subject: Subject<Forecast>;

	constructor() {
		this.subject = new Subject<Forecast>();
		this.forecast = this.subject.asObservable();
		this.worker = new Worker('assets/js/darksky-worker.js');
		this.worker.addEventListener('message', (event) => {
			this.handleData(event.data);
		});
	}

	setInterval(interval) {
		this.interval = interval;
		this.worker.postMessage({
			command: 'interval',
			interval: interval
		});	
	}

	startPolling() {
		this.worker.postMessage({
			command: 'start',
			interval: this.interval,
			location: {
				latitude: this.latitude,
				longitude: this.longitude
			}
		});
	}

	stopPolling() {

	}

	poll() {
		this.worker.postMessage({
			command: 'poll'
		});		
	}

	handleData(data: any) {

		let forecast = new Forecast();
		let dateTime = this.convertTimestamp(parseInt(data.currently.time), data.timezone);

		forecast.timezone = data.timezone;

		forecast.current.summary = data.currently.summary;
		forecast.current.icon = this.getIconClass(data.currently.icon);
		forecast.current.temperature = parseInt(data.currently.temperature);
		forecast.current.time = dateTime.toLocaleString({ hour: '2-digit', minute: '2-digit' });
		forecast.current.date = dateTime.toLocaleString({ month: 'short', day: '2-digit' });

		data.daily.data.slice(1).forEach(daily => {

			let conditions = new Conditions();

			dateTime = this.convertTimestamp(parseInt(daily.time), data.timezone);

			conditions.summary = daily.summary;
			conditions.icon = this.getIconClass(daily.icon);
			conditions.temperatureHigh = parseInt(daily.temperatureHigh);
			conditions.temperatureLow = parseInt(daily.temperatureLow);
			conditions.time = dateTime.toLocaleString({ hour: '2-digit', minute: '2-digit' });
			conditions.date = dateTime.toLocaleString({ month: 'short', day: '2-digit' });

			forecast.daily.push(conditions);
		});

		this.subject.next(forecast);
	}

	private convertTimestamp(timestamp: number, timezone: string): DateTime {

		var date = new Date(timestamp * 1000);

		return DateTime.fromJSDate(date, { zone: timezone });
	}

	private getIconClass(icon: string): string {

		switch (icon) {
			case 'clear-day':
				return 'wi-day-sunny';
			case 'clear-night':
				return 'wi-night-clear';
			case 'rain':
				return 'wi-rain';
			case 'snow':
				return 'wi-snow';
			case 'sleet':
				return 'wi-sleet';
			case 'wind':
				return 'wi-windy';
			case 'fog':
				return 'wi-fog';
			case 'cloudy':
				return 'wi-cloudy';
			case 'partly-cloudy-day':
				return 'wi-day-cloudy';
			case 'partly-cloudy-night':
				return 'wi-night-partly-cloudy';
			default:
				return '';
		}
	}

}