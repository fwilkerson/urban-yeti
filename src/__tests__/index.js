import test from 'ava';

import UrbanYeti from '../../dist/urban-yeti';

process.setMaxListeners(0);

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

let obs;
test.beforeEach(() => {
	obs = new UrbanYeti('url');
});

test('contrsuctor', t => {
	t.true(obs && typeof obs === 'object');
});

test('properties', t => {
	t.true('subscribe' in obs);
	t.true(typeof obs.subscribe === 'function');
	t.true('filter' in obs);
	t.true(typeof obs.filter === 'function');
	t.true('map' in obs);
	t.true(typeof obs.map === 'function');
});

test.cb('subscribe : websocket message', t => {
	const event = {data: 'hello'};

	obs.subscribe(e => {
		t.true(e === event);
		t.end();
	});
	send(event);
});

test('subscribe : gets hit for every message', t => {
	t.plan(3);

	for (let i = 0; i < 3; i++) {
		send(i);
	}
	obs.subscribe(e => {
		t.true(typeof e === 'number');
	});
});

test('subscribe : does not care if message happens before or after', t => {
	t.plan(2);

	send('before');
	obs.subscribe(e => {
		t.true(typeof e === 'string');
	});
	send('after');
});

test('subscribe : messages can be filtered', t => {
	t.plan(1);

	for (let i = 0; i < 3; i++) {
		send(i);
	}
	obs.filter(e => e > 1).subscribe(e => {
		t.true(typeof e === 'number');
	});
});

test.cb('subscribe : messages can be transformed with map', t => {
	send(JSON.stringify({data: 'hello'}));
	obs.map(e => JSON.parse(e)).subscribe(e => {
		t.true(typeof e === 'object');
		t.true(e.data === 'hello');
		t.end();
	});
});

test('subscribe : messages can be mapped and filtered', t => {
	t.plan(2);

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

test.cb('subscribe : messages can be throttled', t => {
	obs.throttle(1e2).subscribe(e => {
		t.true(e === 2);
		t.end();
	});

	for (let i = 0; i < 3; i++) {
		send(i);
	}
});

test.cb('subscribe : messages can be throttled, even prior to subscribe', t => {
	for (let i = 0; i < 3; i++) {
		send(i);
	}

	obs.throttle(1e2).subscribe(e => {
		t.true(e === 2);
		t.end();
	});
});

test.serial.cb('subscribe : throttled messages can be batched', t => {
	obs.throttle(1e2, true).subscribe(e => {
		t.true(Array.isArray(e));
		t.true(e.length === 3);
		t.end();
	});

	for (let i = 0; i < 3; i++) {
		send(i);
	}
});

test.serial.cb('throttled messages are batched even prior to subscribe', t => {
	for (let i = 0; i < 3; i++) {
		send(i);
	}

	obs.throttle(1e2, true).subscribe(e => {
		t.true(Array.isArray(e));
		t.true(e.length === 3);
		t.end();
	});
});

test.serial.cb('throttle, map, filter', t => {
	obs
		.throttle(1e2)
		.map(e => e.data)
		.filter(e => e !== 'world')
		.subscribe(e => {
			t.true(e === 'hello');
			t.end();
		});

	send({data: 'hello!'});
	send({data: 'world'});
	send({data: 'hello'});
	send({data: 'world'});
});

test.serial.cb('throttle, map, filter, prior to subscribe', t => {
	send({data: 'hello!'});
	send({data: 'world'});
	send({data: 'hello'});
	send({data: 'world'});

	obs
		.throttle(1e2)
		.map(e => e.data)
		.filter(e => typeof e === 'string' && e.includes('hello'))
		.subscribe(e => {
			t.true(e === 'hello');
			t.end();
		});
});

test.serial.cb('batch throttle, map, filter', t => {
	obs
		.throttle(1e2, true)
		.map(e => e.data)
		.filter(e => e !== 'world')
		.subscribe(e => {
			t.true(Array.isArray(e));
			t.true(e.length === 2);
			t.end();
		});

	send({data: 'hello!'});
	send({data: 'world'});
	send({data: 'hello'});
	send({data: 'world'});
});

test.serial.cb('batch throttle, map, filter, prior to subscribe', t => {
	send({data: 'hello!'});
	send({data: 'world'});
	send({data: 'hello'});
	send({data: 'world'});

	obs
		.throttle(1e2, true)
		.map(e => e.data)
		.filter(e => e !== 'world')
		.subscribe(e => {
			t.true(Array.isArray(e));
			t.true(e.length === 2);
			t.end();
		});
});
