/**
 * Node Slideshow 1.0
 * September 14, 2010
 * Corey Hart @ http://www.codenothing.com
 */
jQuery(function(){
	// Cheap mobile check
	var mobile = ( 'Touch' in window ), time = jQuery('#time'), slideWrapper = jQuery('#slides'), slides, timeLeft, timeWarning, timeid;


	// Configuration update
	function config( data ) {
		var max = parseInt( data.max, 10 ) + 1, i = 0, list = '';

		for ( ; ++i < max; ) {
			list += "<div>" + i + "</div>";
		}

		slides = slideWrapper.html( list ).children('div');
		slides.removeClass('chosen').eq( data.slide ).addClass('chosen');


		// Countdown timer
		timeLeft = parseInt( data.timeLeft / 1000, 10 );
		timeWarning = parseInt( data.timeWarning / 1000, 10 );
		timer();

		// Always clear the interval
		if ( timeid ) {
			timeid = clearInterval( timeid );
		}

		// If timer still enabled, run it
		if ( data.timeEnabled ) {
			timeid = setInterval(function(){
				timeLeft--;
				timer();
			}, 1000);
		}
	}


	// Countdown Display
	function timer(){
		var min = parseInt( timeLeft / 60, 10 ), sec = timeLeft % 60;

		// Zero-fill
		if ( min < 10 ) {
			min = '0' + min;
		}

		// Zero-fill
		if ( sec < 10 ) {
			sec = '0' + sec;
		}

		// Don't go into negatives
		if ( timeLeft < 1 ) {
			min = '00';
			sec = '00';
		}

		// Color coding
		time[ 0 ].className = '';
		time.html( min + ':' + sec ).addClass(
			timeLeft < 1 ? 'end' :
			timeLeft < timeWarning ? 'warn' :
			''
		);
	}


	// Slide Selection
	slideWrapper.bind( mobile ? 'touchstart' : 'click', function( event ) {
		var target = jQuery( event.target );

		if ( target.is('div') ) {
			slides.removeClass('chosen');
			target.addClass('chosen');
			jQuery.getJSON('/', { op: 'slide', slide: parseInt( target.text(), 10 ) - 1, _CacheKiller: Date.now() }, config );
		}
	});


	// Action Effects
	jQuery('#next,#prev').bind( mobile ? 'touchstart' : 'mousedown', function(){
		jQuery( this ).addClass('chosen');
		jQuery.getJSON( '/', { op: this.id + '-slide', _CacheKiller: Date.now() }, config );
		return false;
	})
	.bind( mobile ? 'touchend' : 'mouseup', function(){
		jQuery( this ).removeClass('chosen');
		return false;
	});


	// Build the page
	jQuery.getJSON( '/', { op: 'config', _CacheKiller: Date.now() }, config );
});
