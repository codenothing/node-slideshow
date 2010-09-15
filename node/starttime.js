/**
 * Node Slideshow 1.0
 * September 14, 2010
 * Corey Hart @ http://www.codenothing.com
 */
var sys = require('sys'),
	http = require('http'),
	Config = require('./Config').Config,
	client = http.createClient( Config.masterport ),
	request = client.request('GET', '/?op=start-time');

request.end();
request.on('response', function( response ) {
	var min = parseInt( Config.timed / 60000, 10 ), sec = Config.timed % 60000;

	// Zero Fill
	if ( min < 10 ) {
		min = '0' + min;
	}

	// Zero Fill
	if ( sec < 10 ) {
		sec = '0' + sec;
	}

	sys.puts( 'Presentation Timer Started - ' + min + ':' + sec + ' left' );
});
