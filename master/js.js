/**
 * Node Slide [VERSION]
 * [DATE]
 * Corey Hart @ http://www.codenothing.com
 */
jQuery(function(){
	// Cheap mobile check
	var mobile = ( 'Touch' in window ), time = jQuery('#time'), slides, selected, timeLeft, timeWarning, timeid;

	function change( op ) {
		jQuery.get('/', { op: op, _CacheKiller: Date.now() }, function( response ) {
			jQuery.getJSON('/', { op: 'config', _Cache: Date.now() }, function( data ) {
				selected = data.slide;
				slides.removeClass('chosen').eq( selected ).addClass('chosen');

				// Countdown timer
				timeLeft = parseInt( data.timeLeft / 1000, 10 );
				timeWarning = parseInt( data.timeWarning / 1000, 10 );
				timer();
				if ( data.timeEnabled ) {
					if ( timeid ) {
						timeid = clearInterval( timeid );
					}
					timeid = setInterval(function(){
						timeLeft--;
						timer();
					}, 1000);
				}
			});
		});
	}

	function next(){
		change('next-slide');
		return false;
	}

	function prev(){
		change('prev-slide');
		return false;
	}

	function timer(){
		var min = parseInt( timeLeft / 60, 10 ), sec = timeLeft % 60;
		if ( min < 10 ) {
			min = '0' + min;
		}
		if ( sec < 10 ) {
			sec = '0' + sec;
		}
		if ( timeLeft < 1 ) {
			min = '00';
			sec = '00';
		}
		time[ 0 ].className = '';
		time.html( min + ':' + sec ).addClass(
			timeLeft < 1 ? 'end' :
			timeLeft < timeWarning ? 'warn' :
			''
		);
	}


	// Action handlers
	jQuery('#next').bind( mobile ? 'touchstart' : 'click', next);
	jQuery('#prev').bind( mobile ? 'touchstart' : 'click', prev);


	// Hover Effects
	jQuery('#next,#prev').bind( mobile ? 'touchstart' : 'mousedown', function(){
		jQuery( this ).addClass('chosen');
	})
	.bind( mobile ? 'touchend' : 'mouseup', function(){
		jQuery( this ).removeClass('chosen');
	});


	// Listing slides
	jQuery.getJSON('/', { op: 'config', _Cache: Date.now() }, function( data ) {
		var max = parseInt( data.max, 10 ) + 1, i = 0, list = '';
		console.warn( data );

		for ( ; ++i < max; ) {
			list += "<div>" + i + "</div>";
		}

		jQuery('#slides').html( list ).bind( mobile ? 'touchstart' : 'click', function( event ) {
			var target = jQuery( event.target );

			if ( target.is('div') ) {
				selected = parseInt( target.text(), 10 ) - 1;
				jQuery.get('/', { op: 'slide', slide: selected, _CacheKiller: Date.now() }, function( response ) {
					console.log( response );
					slides.removeClass('chosen').eq( selected ).addClass('chosen');
				});
			}
		});
		
		slides = jQuery('#slides').children('div');
		slides.removeClass('chosen').eq( selected = data.slide ).addClass('chosen');


		// Countdown timer
		timeLeft = parseInt( data.timeLeft / 1000, 10 );
		timeWarning = parseInt( data.timeWarning / 1000, 10 );
		timer();
		if ( data.timeEnabled ) {
			if ( timeid ) {
				timeid = clearInterval( timeid );
			}
			timeid = setInterval(function(){
				timeLeft--;
				timer();
			}, 1000);
		}
	});
});
