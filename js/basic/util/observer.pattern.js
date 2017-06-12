'use strict';
define(function() {
	/**
	 * 订阅模式模块
	 */

	var observer,
		subscribers;

	/**
	 * 订阅者列表
	 * 将订阅者作为公共变量,类似cache,
	 * 订阅者订阅事件时,不需要含有发布者的引用
	 * @type {Object}
	 */
	subscribers = {};

	/**
	 * 订阅模式装饰类
	 * @type {Object}
	 */
	observer = {
		/**
		 * 订阅者
		 * @type {Object}
		 */
		subscriber: {
			/**
			 * 订阅类型
			 * @param  {string}   publisherName 发布者名称
			 * @param  {string}   type      订阅类型
			 * @param  {function} fn     	订阅回调函数   
			 */
			subscribe: function(publisherName, type, fn) {
				var temp1,
					temp2;
				if (typeof(temp1 = subscribers[publisherName]) === 'undefined') {
					temp1 = subscribers[publisherName] = {};
				}
				if (typeof(temp2 = temp1[type]) === 'undefined') {
					temp2 = temp1[type] = [];
				}
				temp2.push({
					fn: fn,
					master: this
				});
			},
			/**
			 * 取消订阅  
			 * @param  {string}   publisherName 发布者名称
			 * @param  {string}   type      订阅类型
			 */
			unsubscribe: function(publisherName, type) {
				var currentSubscribers,
					currentSubscriber,
					types,
					max, i;

				types = subscribers[publisherName];
				if (types === undefined) {
					return;
				}
				currentSubscribers = types[type];
				max = currentSubscribers !== undefined ? currentSubscribers.length : 0;
				for (i = 0; i < max; i++) {
					currentSubscriber = currentSubscribers[i];
					if (currentSubscriber.master === this) {
						currentSubscribers.splice(i, 1);
					}
				}
			},
		},
		/**
		 * 发布者
		 * @property {object} publisher
		 */
		publisher: {
			/**
			 * 发布
			 * @param  {string} name 发布者名称
			 * @param  {string} type 发布类型
			 */
			publish: function(name, type) {
				var currentSubscribers,
					currentSubscriber,
					max, i, callback;

				currentSubscribers = subscribers[name];
				if (currentSubscribers &&
					(currentSubscribers = currentSubscribers[type]) !== undefined) {
					max = currentSubscribers !== undefined ? currentSubscribers.length : 0;
					for (i = 0; i < max; i++) {
						currentSubscriber = currentSubscribers[i];
						callback = currentSubscriber.master[currentSubscriber.fn];
						callback.apply(currentSubscriber.master, [].slice.call(arguments, 2));
					}
				}
			},
		},
		/**
		 * 建立发布者
		 * @method buildPublisher 
		 * @param  {object} obj 建立对象
		 */
		buildPublisher: function(obj) {
			for (var i in this.publisher) {
				if (this.publisher.hasOwnProperty(i) && typeof this.publisher[i] === 'function') {
					obj[i] = this.publisher[i];
				}
			}
		},
		buildSubscriber: function(obj) {
			for (var i in this.subscriber) {
				if (this.subscriber.hasOwnProperty(i) && typeof this.subscriber[i] === 'function') {
					obj[i] = this.subscriber[i];
				}
			}
		},
		clearSubscriber: function() {
			subscribers = {};
		}
	};
	return observer;
});