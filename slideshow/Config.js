/**
 * Node Slide [VERSION]
 * [DATE]
 * Corey Hart @ http://www.codenothing.com
 */
this.Config = {
	// Disable for distribution, and final check for websocket
	enableSocket: true && ( 'WebSocket' in this ),

	// Websocket connection
	host: '10.0.1.2',
	port: 8124,

	// Time takes to transition between slides
	transitions: 200
};
