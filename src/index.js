import Sockette from 'sockette';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export default function(url, opts = {}) {
	let sub;
	let last;
	let throttleTime;
	let throttled = false;
	let batched = false;
	let msgs = [];

	const self = this;
	const mods = [];

	// eslint-disable-next-line no-unused-vars
	const ws = new Sockette(url, {
		timeout: opts.timeout,
		maxAttempts: opts.maxAttempts,
		onmessage: next,
	});

	function applyMods(e) {
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

		if (!pass) return undefined;

		return e;
	}

	function next(e) {
		if (!sub) return msgs.push(e);

		e = applyMods(e);

		if (e === undefined) return;

		if (!throttleTime) return sub(e);

		if (batched) msgs.push(e);
		else last = e;

		if (!throttled) {
			throttled = true;
			sleep(throttleTime).then(() => {
				throttled = false;
				sub(batched ? msgs : last);
				if (batched) msgs = [];
			});
		}
	}

	self.throttle = (ms, batch = false) => {
		throttleTime = ms;
		batched = batch;
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
			if (batched) {
				msgs = msgs.reduce((acc, n) => {
					n = applyMods(n);
					if (n !== undefined) acc.push(n);
					return acc;
				}, []);
				sub(msgs);
				msgs = [];
			} else msgs.forEach(msg => next(msg));
		}
		return self;
	};

	return self;
}
