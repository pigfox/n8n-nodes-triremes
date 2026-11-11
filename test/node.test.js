'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const { Triremes } = require('../dist/nodes/Triremes/Triremes.node.js');
const { TriremesApi } = require('../dist/credentials/TriremesApi.credentials.js');

const node = new Triremes().description;
const credential = new TriremesApi();

// Every property, options inside collections included.
const all = (properties) => properties.flatMap((p) => [p, ...all(p.options && p.type === 'collection' ? p.options : [])]);

test('the package is an n8n community node package', () => {
	assert.equal(pkg.name, 'n8n-nodes-triremes');
	assert.ok(pkg.keywords.includes('n8n-community-node-package'));
	assert.equal(pkg.license, 'MIT');
	assert.deepEqual(pkg.dependencies, undefined, 'no runtime dependencies');
	for (const file of [...pkg.n8n.credentials, ...pkg.n8n.nodes]) {
		assert.ok(fs.existsSync(path.join(root, file)), file);
	}
	assert.ok(fs.existsSync(path.join(root, 'dist/nodes/Triremes', node.icon.replace('file:', ''))));
});

test('the key goes to triremes.com as a bearer token, and the node names itself', () => {
	assert.equal(credential.name, 'triremesApi');
	assert.equal(node.credentials[0].name, credential.name);
	assert.deepEqual(credential.properties[0].typeOptions, { password: true });
	assert.equal(credential.authenticate.properties.headers.Authorization, '=Bearer {{$credentials.apiKey}}');
	assert.equal(credential.test.request.baseURL, 'https://triremes.com/api/v1');
	assert.equal(node.requestDefaults.baseURL, 'https://triremes.com/api/v1');
	assert.equal(node.requestDefaults.headers['User-Agent'], 'triremes-n8n/1.0');
	assert.equal(credential.test.request.headers['User-Agent'], 'triremes-n8n/1.0');
});

test('the three operations call the API v1 routes', () => {
	const operations = Object.fromEntries(
		node.properties.filter((p) => p.name === 'operation').flatMap((p) => p.options).map((o) => [o.name, o.routing]),
	);
	assert.deepEqual(Object.keys(operations), ['Search Websites', 'Get Website', 'Search Problems']);
	assert.equal(operations['Search Websites'].request.url, '/website-gaps');
	assert.equal(operations['Search Websites'].output.postReceive[0].properties.property, 'sites');
	assert.equal(operations['Get Website'].request.url, '=/website-gaps/{{ $parameter.websiteId }}');
	assert.equal(operations['Search Problems'].request.url, '/problems');
	assert.equal(operations['Search Problems'].output.postReceive[0].properties.property, 'problems');
});

test('each filter is a query parameter the API takes', () => {
	// The parameters API v1 takes (it refuses any other).
	const taken = {
		website: ['category', 'city', 'country', 'cursor', 'gap', 'limit', 'max_sold', 'q', 'region', 'score', 'since'],
		problem: ['cursor', 'has_businesses', 'limit', 'max_sold', 'q', 'since', 'tier'],
	};
	for (const p of node.properties.filter((p) => p.routing && p.displayOptions)) {
		const resource = p.displayOptions.show.resource[0];
		for (const field of all([p])) {
			if (field.routing && field.routing.send) {
				assert.ok(taken[resource].includes(field.routing.send.property), `${resource}: ${field.routing.send.property}`);
			}
		}
	}
	for (const p of node.properties.filter((p) => p.type === 'collection')) {
		const resource = p.displayOptions.show.resource[0];
		for (const field of p.options) {
			assert.equal(field.routing.send.type, 'query');
			assert.ok(taken[resource].includes(field.routing.send.property), `${resource}: ${field.routing.send.property}`);
		}
	}
});

test('no email address and nothing on how Triremes works', () => {
	for (const file of ['dist/nodes/Triremes/Triremes.node.js', 'dist/credentials/TriremesApi.credentials.js', 'README.md']) {
		const text = fs.readFileSync(path.join(root, file), 'utf8');
		assert.doesNotMatch(text, /[\w.+-]+@[\w-]+\.[\w.]+/, file);
		assert.doesNotMatch(text.replace('robots.txt blocks all crawlers', ''), /crawl|scrap|\bsources?\b/i, file);
	}
});
