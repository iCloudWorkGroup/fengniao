'use strict';
define(function(require) {
	var $ = require('lib/jquery');
	return {
		getTextHeight: function(text, fontSize, width) {
			var tempDiv,
				height;

			tempDiv = $('<div/>').text(text);
			tempDiv.css({
				'display': 'none',
				'font-size': fontSize + 'pt',
				'wordBreak': 'break-word',
				'whiteSpace': 'pre-line'
			});
			if (width !== undefined) {
				tempDiv.css({
					'width': width
				});
			}
			$('body').append(tempDiv);
			height = parseInt(tempDiv.height());
			tempDiv.remove();
			return height;
		},
		getInputHeight: function(text, fontSize, width) {
			var tempTextarea,
				height;
			tempTextarea = $('<textarea>');
			tempTextarea.css({
				'visibility': 'hidden',
				'font-size': fontSize + 'pt',
				'height': 0,
				'width': width + 'px',
				'overflow': 'scroll',
			});
			$('body').append(tempTextarea);
			tempTextarea.val(text);
			height = parseInt(tempTextarea[0].scrollHeight);
			tempTextarea.remove();
			return height;
		},
		getInputWidth: function(text, fontSize) {
			var tempTextarea,
				width;
			tempTextarea = $('<textarea>');
			tempTextarea.css({
				'position': 'absolute',
				'visibility': 'hidden',
				'font-size': fontSize + 'pt',
				'height': 0,
				'width': 0,
				'overflow': 'scroll',
			});
			tempTextarea.attr('wrap','off');
			$('body').append(tempTextarea);
			tempTextarea.val(text);
			width = parseInt(tempTextarea[0].scrollWidth);
			tempTextarea.remove();
			return width;
		}
	};
});