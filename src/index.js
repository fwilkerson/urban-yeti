exports.Observe = function(ws) {
	let sub;

	const self = this;
	const mods = [];
	const msgs = [];

	ws.addEventListener('message', next);

	function next(e) {
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
};
