/**
 * Node SlideShow [VERSION]
 * [DATE]
 * Corey Hart @ http://www.codenothing.com
 */
jQuery(function(){
	var deck = jQuery('#deck'), slides = deck.children('section'), win = jQuery( window ), slide = 0, width, height;


	// Slide Transition
	function change(){
		deck.stop().animate( { marginLeft: ( slide * width ) * -1 }, Config.transitions );
	}


	// Handle page resizing
	win.resize(function(){
		// Dimensions
		width = win.width();
		height = win.height();

		slides.width( width - 60 ).height( height - 30 );
		deck.width( width * slides.length + 100 );
	}).resize();

	// Allow custom slide views
	jQuery( document ).keyup(function( event ) {
		// left
		if ( event.keyCode == 37 ) {
			if ( slide > 0 ) {
				slide--;
				change();
			}
		}
		// right
		else if ( event.keyCode == 39 ) {
			if ( slide + 1 < slides.length ) {
				slide++;
				change();
			}
		}
		return false;
	});
	
	// Only create the connection if allowed
	if ( Config.enableSocket ) {
		var connection = new WebSocket( 'ws://' + Config.host + ':' + Config.port + '/' );
		connection.onmessage = function( event ) {
			var msg = JSON.parse( event.data );
			if ( msg.slide !== undefined ) {
				slide = msg.slide;
				change();
			}
		};
	}
});
