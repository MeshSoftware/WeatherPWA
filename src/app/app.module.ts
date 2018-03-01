import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MaterialModule } from './material.module';

import { AppComponent, LocationDialogComponent } from './app.component';
import { LocationService } from './services/location.service';
import { LocationComponent } from './components/location/location.component';


@NgModule({
	declarations: [
		AppComponent,
		LocationDialogComponent,
		LocationComponent
	],
	imports: [
		BrowserModule,
		ServiceWorkerModule.register('/ngsw-worker.js', {enabled: environment.production}),
		BrowserAnimationsModule,
		FormsModule,
		HttpClientModule,
		MaterialModule
	],
	entryComponents: [
		LocationDialogComponent
	],
	providers: [
		LocationService
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
