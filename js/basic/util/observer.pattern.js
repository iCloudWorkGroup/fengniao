'use strict';
define(function() {
	/**
	 * 订阅模式模块
	 */

	var observer,
		subscribers;

	/**
	 * 订阅者列表
	 * 将订阅者作为公共变量,类似cache的缓存
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
			 * @param  {function} fn     	订阅回调函数   
			 * @param  {string}   publisher 订阅者标识
			 * @param  {string}   type      订阅类型
			 */
			subscribe: function(publisher, type, fn) {
				var temp1,
					temp2;
				if (typeof(temp1 = subscribers[publisher]) === 'undefined') {
					temp1 = subscribers[publisher] = {};
				}
				if (typeof(temp2 = temp1[type]) === 'undefined') {
					temp2 = temp1[type] = [];
				}
				temp2.push({
					fn: fn,
					context: this
				});
			},
			/**
			 * 取消订阅
			 * @param  {function} fn     	订阅回调函数   
			 * @param  {string}   publisher 订阅者标识
			 * @param  {string}   type      订阅类型
			 */
			unsubscribe: function(publisher, type, fn) {
				var currentSubscribers,
					currentSubscriber,
					max, i;

				currentSubscribers = subscribers[publisher];
				max = currentSubscribers !== undefined ? currentSubscribers.length : 0;
				for (i = 0; i < max; i++) {
					currentSubscriber = currentSubscribers[i];
					if (currentSubscriber.fn === fn && currentSubscriber.context === this) {
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
			 * @param  {string} name 发布者标识
			 * @param  {string} type 发布类型
			 */
			publish: function(name, type) {
				var currentSubscribers,
					currentSubscriber,
					max, i, callback;

				currentSubscribers = subscribers[name];
				if (currentSubscribers !== undefined &&
					(currentSubscribers = currentSubscribers[type]) !== undefined) {
					max = currentSubscribers !== undefined ? currentSubscribers.length : 0;
					for (i = 0; i < max; i++) {
						currentSubscriber = currentSubscribers[i];
						currentSubscriber.context[currentSubscriber.fn]([].slice.call(arguments, 2));
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
		}
	};
	return observer;
});