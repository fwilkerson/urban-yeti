const test = require('ava');

const {Observe} = require('..');

global.WebSocket = function() {
	const self = this;
	self.onmessage = () => {}; // eslint-disable-line unicorn/prefer-add-event-listener
	process.on('fake-message', e => {
		self.onmessage(e);
	});
	return this;
};

const send = e => {
	process.emit('fake-message', e);
};

test('contrsuctor', t => {
	const obs = new Observe('url');

	t.true(obs && typeof obs === 'object');
});

test('properties', t => {
	const obs = new Observe('url');

	t.true('subscribe' in obs);
	t.true(typeof obs.subscribe === 'function');
	t.true('filter' in obs);
	t.true(typeof obs.filter === 'function');
	t.true('map' in obs);
	t.true(typeof obs.map === 'function');
});

test.cb('subscribe : websocket message', t => {
	const event = {data: 'hello'};
	const obs = new Observe('url');

	obs.subscribe(e => {
		t.true(e === event);
		t.end();
	});
	send(event);
});

test('subscribe : gets hit for every message', t => {
	t.plan(3);

	const obs = new Observe('url');

	for (let i = 0; i < 3; i++) {
		send(i);
	}
	obs.subscribe(e => {
		t.true(typeof e === 'number');
	});
});

test('subscribe : does not care if message happens before or after', t => {
	t.plan(2);

	const obs = new Observe('url');

	send('before');
	obs.subscribe(e => {
		t.true(typeof e === 'string');
	});
	send('after');
});

test('subscribe : messages can be filtered', t => {
	t.plan(1);

	const obs = new Observe('url');

	for (let i = 0; i < 3; i++) {
		send(i);
	}
	obs.filter(e => e > 1).subscribe(e => {
		t.true(typeof e === 'number');
	});
});

test.cb('subscribe : messages can be transformed with map', t => {
	const obs = new Observe('url');

	send(JSON.stringify({data: 'hello'}));
	obs.map(e => JSON.parse(e)).subscribe(e => {
		t.true(typeof e === 'object');
		t.true(e.data === 'hello');
		t.end();
	});
});

test('subscribe : messages can be mapped and filtered', t => {
	t.plan(2);

	const obs = new Observe('url');

	for (let i = 0; i < 3; i++) {
		send(i);
	}
	obs
		.map(e => e + 1)
		.filter(e => e > 1)
		.subscribe(e => {
			t.true(typeof e === 'number');
		});
});

test.cb('subscribe : messages can be filtered and mapped', t => {
	const obs = new Observe('url');

	for (let i = 0; i < 3; i++) {
		send(i);
	}
	obs
		.filter(e => e > 1)
		.map(e => e * e)
		.subscribe(e => {
			t.true(e === 4);
			t.end();
		});
});
