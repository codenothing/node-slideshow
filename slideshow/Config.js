/**
 * Node Slideshow 1.0
 * September 14, 2010
 * Corey Hart @ http://www.codenothing.com
 */
this.Config = {
	// Disable for distribution, and final check for websocket
	enableSocket: true && ( 'WebSocket' in this ),

	// Websocket connection
	host: 'localhost',
	port: 8080,

	// Time takes to transition between slides
	transitions: 200
};
