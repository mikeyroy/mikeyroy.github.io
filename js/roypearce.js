var RP = {
	initialize: function() {
		// this.setupAudio();
		this.setupAnimations();
	},

	setupAudio: function() {
		var spinAudio = [];
		spinAudio.push(getNextAudio('spin'));

		var clickAudio = [];
		clickAudio.push(getNextAudio('click'));

		[].slice.call(document.getElementsByClassName('hex')).forEach(function(hex) {
			hex.addEventListener('mouseover', function() {
				play('spin');
			});
		});

		[].slice.call(document.getElementsByClassName('webicon')).forEach(function(webicon) {
			webicon.addEventListener('click', function() {
				play('click');
			});
		});

		function play(type) {
			var audio = getNextAudio(type);
			audio.play();
		}

		function getNextAudio(type) {
			var collection;

			switch (type) {
				case 'click':
						collection = clickAudio;
					break;
				case 'spin':
						collection = spinAudio;
					break;
			}

			var audio = collection.shift();
			if (!audio) {
				audio = createNewAudio(type, collection);
			}

			return audio;
		}

		function createNewAudio(type, collection) {
			var audio = new Audio();

			if (audio.canPlayType('audio/ogg')) {
				audio.src = '/audio/' + type + '.ogg';
			} else if (audio.canPlayType('audio/mp3')) {
				audio.src = '/audio/' + type + '.mp3';
			}

			if (type === 'spin') {
				audio.duration = 0.03;
				audio.volume = 0.3;
			} else if ('click') {
				audio.duration = 0.015
				audio.volume = 1;
			}

			audio.preload = 'auto';
			audio.load();
			audio.addEventListener('ended', function() {
				collection.push(audio);
			});

			return audio;
		}
	},

	setupAnimations: function() {
		[].slice.call(document.getElementsByClassName('webicon')).forEach(function(hex) {
			hex.addEventListener('click', handleAnimation);
		});

		var degrees = [];
		var currentRotation = 180;
		var multiplier = 1;
		while (currentRotation > 0) {
			currentRotation = Math.floor(currentRotation * 0.8);
			degrees.push(currentRotation * multiplier + 180);
			multiplier *= -1;
		}
		degrees = degrees.map(function(deg) {
			return { transform: 'translate3d(0, 0, 0) rotateZ(' + deg + 'deg)' };
		});

		function handleAnimation(evt) {
			var hex = evt.target.parentNode.parentNode;

			if (hex.animate) {
				evt.preventDefault();

				var swing = hex.animate(degrees, {
					duration: 4400,
					easing: 'cubic-bezier(0.8, 0.8, 0.8, 0.8)',
					fill: 'forwards'
				});

				swing.onfinish = function() {
					var drop = hex.animate([
						{ transform: 'translate3d(0, 0, 0) rotateZ(180deg)' },
						{ transform: 'translate3d(0, ' + window.innerHeight + 'px, 0) rotateZ(180deg)' }
					], {
						duration: 550,
						easing: 'ease-in',
						fill: 'forwards'
					});

					drop.onfinish = function() {
						window.location.href = evt.target.href;
					};
				};
			}
		}
	}
};


document.addEventListener("DOMContentLoaded", function() {
  RP.initialize();
});

(function(i,s,o,g,r,a,m){i["GoogleAnalyticsObject"]=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,"script","//www.google-analytics.com/analytics.js","ga");ga("create", "UA-1322248-1", "mikepearce.us");ga("send", "pageview");
