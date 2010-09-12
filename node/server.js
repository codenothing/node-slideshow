/**
 * Node Slideshow [VERSION]
 * [DATE]
 * Corey Hart @ http://www.codenothing.com
 */
var sys = require('sys'),
	http = require('http'),
	fs = require('fs'),
	querystring = require('querystring'),
	ws = require('./ws'),
	Config = require('./Config').Config,
	server = ws.createServer(),
	Info = {
		timeLeft: Config.timed,
		timeWarning: Config.timeWarning,
		timeEnd: 0,
		timeEnabled: false,
		slide: 0,
		max: 0
	},
	stack = {},
	rdir = /\/$/, rstart = /^[^\/]/;



/*
	Socket
*/
server.addListener("connection", function( conn ) {
	sys.puts( 'Connection Created [id:' + conn.id + '] [time:' + Date.now() + ']' );
	conn.write(
		JSON.stringify({
			slide: Info.slide
		})
	);
	stack[ conn.id ] = conn;
});
server.addListener("close", function( conn ) {
	sys.puts( 'Closing Connection [id:' + conn.id + '] [time:' + Date.now() + ']' );
	if ( stack.hasOwnProperty( conn.id ) ) {
		delete stack[ conn.id ];
	}
});
server.listen( Config.port );
sys.puts( 'Socket created on port ' + Config.port );




/*
	Server
*/
http.createServer(function( request, response ) {
	var parts = request.url.split('?'), file = parts[ 0 ], query = querystring.parse( parts[ 1 ] || '' ), ret = {};

	// Prevent backpeddling
	if ( file.indexOf('../') > -1 ) {
		response.writeHead( 400 );
		response.end("Invalid Request");
		return;
	}
	else if ( rdir.exec( file ) ) {
		file += 'index.html';
	}
	else if ( rstart.exec( file ) ) {
		file = '/' + file;
	}


	// Operations check
	if ( query.op == 'config' ) {
		Info.timeLeft = Info.timeEnd - Date.now();
		response.writeHead( 200 );
		response.end( JSON.stringify( Info ) );
		return;
	}
	else if ( query.op == 'start-time' ) {
		Info.timeEnabled = true;
		Info.timeEnd = Date.now() + Config.timed;
		Info.timeLeft = Info.timeEnd;
		response.writeHead( 200 );
		response.end( JSON.stringify( Info ) );
		return;
	}
	else if ( query.op == 'next-slide' && ( Info.slide + 1 ) < Info.max ) {
		ret.slide = ++Info.slide;
	}
	else if ( query.op == 'prev-slide' && Info.slide > 0 ) {
		ret.slide = --Info.slide;
	}
	else if ( query.op == 'slide' && ( query.slide = parseInt( query.slide, 10 ) ) > -1 && query.slide < Info.max ) {
		ret.slide = query.slide;
	}


	// Do slide transition if requested
	if ( ret.slide !== undefined ) {
		Info.slide = ret.slide;
		for ( var i in stack ) {
			if ( stack[ i ] ) {
				stack[ i ].broadcast( JSON.stringify( ret ) );
				stack[ i ].write( JSON.stringify( ret ) );
				break;
			}
		}
		Info.timeLeft = Info.timeEnd - Date.now();
		response.writeHead( 200 );
		response.end( JSON.stringify( Info ) );
	}
	// Sometimes operations cannot be be completed, 
	// this is a fallback so full pages are downloaded on those requests
	else if ( query.op ) {
		response.writeHead( 200 );
		response.end( JSON.stringify( Info ) );
	}
	else {
		fs.readFile( __dirname + '/../master' + file, function( e, data ) {
			if ( e ) {
				sys.puts( 'Bad File Request - ' + e );
				response.writeHead( 400 );
				response.end("<h1>Bad Request</h1>");
			}
			else {
				response.writeHead( 200 );
				response.end( data );
			}
		});
	}

}).listen( Config.masterport );
sys.puts('Master Controller Enabled at http://localhost:' + Config.masterport + '/' );


/* Reading Max Slides */
fs.readFile( __dirname + '/../slideshow/index.html', 'utf-8', function( e, data ) {
	Info.max = data.match( /<section[> ]/g ).length;
	sys.puts( Info.max + ' Slides');
});
