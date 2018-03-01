import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { DateTime } from 'luxon';
import { Location } from '../models/location';
import { Forecast, Conditions } from '../models/forecast';

import 'rxjs/add/observable/of';

const LOCAL_STORAGE_KEY = 'WeatherPWA-Locations';

@Injectable()
export class LocationService {

	locations: Observable<Location[]>;
	spinner: Observable<boolean>;

	private locationsDict: any;
	private locationsSub: Subject<Location[]>;
	private spinnerSub: Subject<boolean>;

	constructor(
		private snackBar: MatSnackBar,
		private http: HttpClient
	) {
		this.locationsSub = new Subject<Location[]>();
		this.spinnerSub = new Subject<boolean>();
		this.locations = this.locationsSub.asObservable();
		this.spinner = this.spinnerSub.asObservable();

		this.spinnerSub.next(false);
	}

	refresh() {
		this.locationsDict = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
		this.locationsSub.next(Object.values<Location>(this.locationsDict));
	}

	addLocation(zipCode: string) {

		let storedLocation = this.locationsDict[zipCode];

		if (storedLocation) {
			this.showMessage(`The zip code '${zipCode}' is already listed.`);
		}
		else {

			this.spinnerSub.next(true);

			let mapsUrl = `https://us-central1-weatherpwa-4a551.cloudfunctions.net/api/geocoding/${zipCode}/`;

			this.http.get<any>(mapsUrl).subscribe(geocoding => {

				if (geocoding.length) {

					let location = new Location();

					location.name = geocoding[0].formatted_address.replace(` ${zipCode}, USA`, '');
					location.zip = zipCode;
					location.latitude = geocoding[0].geometry.location.lat;
					location.longitude = geocoding[0].geometry.location.lng;

					this.locationsDict[zipCode] = location;

					localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.locationsDict));
					this.refresh();
					this.spinnerSub.next(false);
				}
				else {
					this.spinnerSub.next(false);
					this.showMessage(`The zip code '${zipCode}' could not be located.`);
				}
			});
		}
	}

	removeLocation(zipCode: string) {

		delete this.locationsDict[zipCode];

		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.locationsDict));
		
		this.refresh();
	}

	getForecast(location: Location): Observable<Forecast> {

		let forecastUrl = `https://us-central1-weatherpwa-4a551.cloudfunctions.net/api/forecast/${location.latitude}/${location.longitude}/`;
		let subject = new Subject<Forecast>();

		this.http.get<any>(forecastUrl).subscribe(data => {

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

			subject.next(forecast);
		});

		return subject.asObservable();
	}

	private showMessage(message) {

		let snackBarRef = this.snackBar.open(message, 'Ok', {
			duration: 3000,
		});
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
