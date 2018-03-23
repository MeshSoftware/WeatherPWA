import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { Location } from '../models/location';

import 'rxjs/add/observable/of';

const LOCAL_STORAGE_KEY = 'WeatherPWA-Locations';

@Injectable()
export class LocationService {

	locations: Observable<Location[]>;
	spinner: Observable<boolean>;

	private locationsDict: any;
	private workersDict: any;
	private locationsSub: Subject<Location[]>;
	private spinnerSub: Subject<boolean>;

	constructor(
		private snackBar: MatSnackBar,
		private http: HttpClient
	) {
		this.locationsDict = {};
		this.locationsSub = new Subject<Location[]>();
		this.spinnerSub = new Subject<boolean>();
		this.locations = this.locationsSub.asObservable();
		this.spinner = this.spinnerSub.asObservable();

		this.spinnerSub.next(false);
	}

	init() {
		this.loadLocations();
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

					this.storeLocations();
					
					this.locationsSub.next(Object.values<Location>(this.locationsDict));

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

		this.storeLocations();
		
		this.locationsSub.next(Object.values<Location>(this.locationsDict));
	}

	loadLocations() {

		let locations = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');

		locations.forEach(item => {

			let location = new Location();

			location.latitude = item.latitude;
			location.longitude = item.longitude;
			location.name = item.name;
			location.zip = item.zip;
			location.interval = item.interval || 30;

			this.locationsDict[item.zip] = location;
		});

		this.locationsSub.next(Object.values<Location>(this.locationsDict));
	}

	storeLocations() {

		let storage = [];
		let locations = Object.values<Location>(this.locationsDict);

		locations.forEach(item => {

			storage.push({
				latitude: item.latitude,
				longitude: item.longitude,
				name: item.name,
				zip: item.zip,
				interval: item.interval || 30
			});
		});

		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storage));
	}

	private showMessage(message) {

		let snackBarRef = this.snackBar.open(message, 'Ok', {
			duration: 3000,
		});
	}
}
