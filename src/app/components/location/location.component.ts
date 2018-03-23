import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { LocationService } from '../../services/location.service';
import { Location } from '../../models/location';
import { Forecast } from '../../models/forecast';

@Component({
	selector: 'app-location',
	templateUrl: './location.component.html',
	styleUrls: ['./location.component.css']
})
export class LocationComponent implements OnInit {

	@Input('location')
	location: Location;
	
	city: string;
	state: string;
	forecast: Forecast;
	spinner: boolean;

	constructor(
		private locationService: LocationService
	) { 
		this.forecast = new Forecast();
	}

	ngOnInit() {

		this.spinner = true;

		let locationParts = this.location.name.split(',');

		this.city = locationParts[0];
		this.state = locationParts[1];
		
		this.location.forecast.subscribe(forecast => {
			this.forecast = forecast;
			this.spinner = false;
		});

		this.location.startPolling();
	}

	setInterval(interval) {
		this.location.setInterval(interval);
		this.locationService.storeLocations();
	}

	refresh() {
		this.spinner = true;
		this.location.poll();
	}

	delete() {
		this.locationService.removeLocation(this.location.zip);
	}

}


