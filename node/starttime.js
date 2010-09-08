/**
 * Node SlideShow [VERSION]
 * [DATE]
 * Corey Hart @ http://www.codenothing.com
 */
var sys = require('sys'),
	http = require('http'),
	Config = require('./Config').Config,
	client = http.createClient( Config.masterport ),
	request = client.request('GET', '/?op=start-time');

request.end();
request.on('response', function( response ) {
	sys.puts( 'Time Started' );
});
