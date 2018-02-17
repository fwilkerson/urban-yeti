import Sockette from 'sockette';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export default function(url, opts = {}) {
	let sub;
	let last;
	let throttleTime;
	let throttled = false;

	const self = this;
	const mods = [];
	const msgs = [];

	// eslint-disable-next-line no-unused-vars
	const ws = new Sockette(url, {
		timeout: opts.timeout,
		maxAttempts: opts.maxAttempts,
		onmessage: next,
	});

	function _next(e) {
		let pass = true;
		mods.forEach(mod => {
			switch (mod.type) { // eslint-disable-line default-case
				case 'MAP':
					e = mod.func(e);
					break;
				case 'FILTER':
					pass = mod.func(e);
					break;
			}
		});

		// Check if the event passed the filter
		if (!pass) return;

		// Notify subscriber or queue the event
		if (typeof sub === 'function') sub(e);
		else msgs.push(e);
	}

	function next(e) {
		if (!throttleTime) return _next(e);

		if (throttled) {
			last = e;
		} else {
			throttled = true;
			sleep(throttleTime).then(() => {
				throttled = false;
				_next(last);
			});
		}
	}

	self.throttle = ms => {
		throttleTime = ms;
		return self;
	};

	self.map = func => {
		mods.push({type: 'MAP', func});
		return self;
	};

	self.filter = func => {
		mods.push({type: 'FILTER', func});
		return self;
	};

	self.subscribe = func => {
		sub = func;
		if (msgs.length > 0) {
			msgs.forEach(msg => next(msg));
		}
		return self;
	};

	return self;
}
