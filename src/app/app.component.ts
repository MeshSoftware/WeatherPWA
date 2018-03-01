import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { MatDialog, MatDialogRef } from '@angular/material';
import { SwUpdate } from '@angular/service-worker';
import { LocationService } from './services/location.service';
import { Location } from './models/location';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

	title = 'Weather PWA';

	spinner: boolean;
	locations: Location[];

	constructor(
		public dialog: MatDialog,
		private locationService: LocationService,
		private swUpdate: SwUpdate
	) {
		this.locations = [];
	 }

	ngOnInit() {
		this.locationService.spinner
			.subscribe(spin => this.spinner = spin);
		
		this.locationService.locations
			.subscribe(locations => {
				this.locations = locations;
			});
		
		this.locationService.refresh();

		if (this.swUpdate.isEnabled) {

            this.swUpdate.available.subscribe(() => {

                if(confirm('New version available. Load New Version?')) {
                    window.location.reload();
                }
            });
        } 
	}

	addLocation() {

		let dialogRef = this.dialog.open(LocationDialogComponent);

		dialogRef.afterClosed().subscribe(zipCode => {

			if (zipCode) {
				this.locationService.addLocation(zipCode);
			}
		});
	}

}

@Component({
	selector: 'add-location-dialog',
	templateUrl: './add-location.dialog.html'
})
export class LocationDialogComponent implements OnInit {

	online: boolean;
	zipCode: string;
	
	ngOnInit() {
		if ('onLine' in window.navigator) {
			this.online = window.navigator.onLine;
		}

		this.zipCode = '';
	}

	onChange() {

	}

	onKeydown(event) {
		if (this.isDigit(event.which) && this.zipCode.length < 5) {
			event.returnValue = true;
		}
		else if (this.isEscapeOrArrow(event.key)) {
			event.returnValue = true;
		}
		else {
			event.returnValue = false;
		}
	}

	private isDigit(key): boolean {
		return key >= 48 && key <= 57;
	}

	private isEscapeOrArrow(key): boolean {
		return key == 'Backspace' || key == 'ArrowLeft' || key == 'ArrowRight';
	}
}