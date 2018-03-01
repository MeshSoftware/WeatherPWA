
export class Forecast {

	current: Conditions;
	daily: Conditions[];
	timezone: string;

	constructor() {
		this.current = new Conditions();
		this.daily = [];
		this.timezone = 'America/Boise';
	}
}

export class Conditions {
	summary: string;
	icon: string;
	time: string;
	date: string;
	temperature: number;
	temperatureHigh: number;
	temperatureLow: number
}
