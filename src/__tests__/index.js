const test = require('ava');

const {Observe} = require('..');

const dummy = {addEventListener() {}};

test('contrsuctor', t => {
	const obs = new Observe(dummy);
	t.true(obs && typeof obs === 'object');
});

test('properties', t => {
	const obs = new Observe(dummy);

	t.true('subscribe' in obs);
	t.true(typeof obs.subscribe === 'function');

	t.true('filter' in obs);
	t.true(typeof obs.filter === 'function');

	t.true('map' in obs);
	t.true(typeof obs.map === 'function');
});

test.cb('subscribe : websocket message', t => {
	const event = {data: 'hello'};
	const listeners = {};

	const ws = {
		addEventListener(type, cb) {
			listeners[type] = cb;
		},
	};

	const obs = new Observe(ws);

	t.true(typeof listeners.message === 'function');

	obs.subscribe(e => {
		t.true(e === event);
		t.end();
	});

	listeners.message(event);
});

test('subscribe : gets hit for every message', t => {
	t.plan(3);

	const listeners = {};
	const ws = {
		addEventListener(type, cb) {
			listeners[type] = cb;
		},
	};
	const obs = new Observe(ws);

	for (let i = 0; i < 3; i++) {
		listeners.message(i);
	}

	obs.subscribe(e => {
		t.true(typeof e === 'number');
	});
});

test('subscribe : does not care if message happens before or after', t => {
	t.plan(2);

	const listeners = {};
	const ws = {
		addEventListener(type, cb) {
			listeners[type] = cb;
		},
	};
	const obs = new Observe(ws);

	listeners.message('before');
	obs.subscribe(e => {
		t.true(typeof e === 'string');
	});
	listeners.message('after');
});

test('subscribe : messages can be filtered', t => {
	t.plan(1);

	const listeners = {};
	const ws = {
		addEventListener(type, cb) {
			listeners[type] = cb;
		},
	};
	const obs = new Observe(ws);

	for (let i = 0; i < 3; i++) {
		listeners.message(i);
	}

	obs.filter(e => e > 1).subscribe(e => {
		t.true(typeof e === 'number');
	});
});

test.cb('subscribe : messages can be transformed with map', t => {
	const listeners = {};
	const ws = {
		addEventListener(type, cb) {
			listeners[type] = cb;
		},
	};
	const obs = new Observe(ws);

	listeners.message(JSON.stringify({data: 'hello'}));

	obs.map(e => JSON.parse(e)).subscribe(e => {
		t.true(typeof e === 'object');
		t.true(e.data === 'hello');
		t.end();
	});
});

test('subscribe : messages can be mapped and filtered', t => {
	t.plan(2);
	const listeners = {};
	const ws = {
		addEventListener(type, cb) {
			listeners[type] = cb;
		},
	};
	const obs = new Observe(ws);

	for (let i = 0; i < 3; i++) {
		listeners.message(i);
	}

	obs
		.map(e => e + 1)
		.filter(e => e > 1)
		.subscribe(e => {
			t.true(typeof e === 'number');
		});
});

test.cb('subscribe : messages can be filtered and mapped', t => {
	const listeners = {};
	const ws = {
		addEventListener(type, cb) {
			listeners[type] = cb;
		},
	};
	const obs = new Observe(ws);

	for (let i = 0; i < 3; i++) {
		listeners.message(i);
	}

	obs
		.filter(e => e > 1)
		.map(e => e * e)
		.subscribe(e => {
			t.true(e === 4);
			t.end();
		});
});
