'use strict';
define(function(require) {
	var $ = require('lib/jquery'),
		Backbone = require('lib/backbone'),
		rowOperation = require('entrance/tool/addrow'),
		InsertOperation;
		
	InsertOperation = Backbone.View.extend({
		el: '#insert',
		events: {
			'mousedown li': 'action'
		},
		action: function(e) {
			var operate = $(e.currentTarget).data('operate');
			if(operate === 'column'){
				this.insertColumn();
			}else{
				this.insertRow();
			}
		},
		insertRow: function() {
			rowOperation.addRow();
		},
		insertColumn: function(){

		}
	});
	return InsertOperation;
});