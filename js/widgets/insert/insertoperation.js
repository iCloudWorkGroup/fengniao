'use strict';
define(function(require) {
	var $ = require('lib/jquery'),
		Backbone = require('lib/backbone'),
		rowOperation = require('entrance/tool/addrow'),
		colOperation = require('entrance/tool/addcol'),
		InsertOperation;
		
	InsertOperation = Backbone.View.extend({
		el: '#insert',
		events: {
			'mousedown li': 'action'
		},
		action: function(e) {
			var operate = $(e.currentTarget).data('type');
			if(operate === 'column'){
				this.insertColumn();
			}else{
				this.insertRow();
			}
		},
		insertRow: function() {
			rowOperation.add();
		},
		insertColumn: function(){
			colOperation.add();
		}
	});
	return InsertOperation;
});