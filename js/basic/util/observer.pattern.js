'use strict';
define(function() {
	/**
	 * 订阅模式装饰类
	 * 系统配置变量
	 * @author ray wu
	 * @class observer
	 * @since 0.1.0
	 * @module basic
	 */
	var observer = {
		/**
		 * 发布器
		 * @property {object} publisher
		 */
		publisher: {
			subscribers: {
				any: [] //事件类型：订阅者（subscribers）
			},
			subscribe: function(fn, type) {
				type = type || 'any';
				if (typeof this.subscribers[type] === 'undefined') {
					this.subscribers[type] = [];
				}
				this.subscribers[type].push(fn);
			},
			unsubscribe: function(fn, type) {
				this.visitSubscribers('unsubscribe', fn, type);
			},
			publish: function(publication, type) {
				this.visitSubscribers('publish', publication, type);
			},
			/**
			 * 订阅者触发动作
			 * @method visitSubscribers 
			 * @param  {string} action 发布护着取消订阅
			 * @param  {object} arg    传递发布的内容
			 * @param  {string} type   订阅的类型
			 */
			visitSubscribers: function(action, arg, type) {
				var pubtype = type || 'any',
					subscribers = this.subscribers[pubtype],
					subscriber,
					i,
					max;
				max = subscribers !== undefined ? subscribers.length : 0;
				for (i = 0; i < max; i++) {
					if (action === 'publish') {
						subscriber = subscribers[i];
						if(typeof subscriber === 'object'){
							subscriber.master[subscriber.behavior](arg, subscriber.args);
						}else if(typeof subscriber === 'function'){
							subscriber(arg);
						}
					} else {
						if (subscribers[i] === arg) {
							subscribers.splice(i, 1);
						}
					}
				}
			}
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
			obj.subscribers = {
				any: []
			};
		}
	};
	return observer;
});