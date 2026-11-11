'use strict';

// Triremes for n8n: search the business websites with SEO and AEO gaps on
// sale on Triremes, get one, and search the problems people report, with
// the user's own Triremes API key. A declarative node: n8n sends each
// request as routing describes it, so there is no code to run.

// A query parameter: a filter is sent only once it is added.
const query = (property) => ({ send: { type: 'query', property } });

// The SEO checks a website can fail, by the id the API takes.
const checks = [
	['https', 'Homepage not on HTTPS'],
	['redirects', 'More than 2 redirects to the homepage'],
	['mixed_content', 'HTTP resources on an HTTPS homepage'],
	['ttfb', 'First byte after more than 1800 ms'],
	['title_missing', 'No homepage title'],
	['title_long', 'Homepage title over 60 characters'],
	['title_short', 'Homepage title under 30 characters'],
	['meta_description', 'No meta description'],
	['h1', 'No h1 heading'],
	['canonical', 'No canonical link'],
	['viewport', 'No viewport tag'],
	['open_graph', 'No Open Graph title or image'],
	['noindex', 'Homepage marked noindex'],
	['robots_blocks_all', 'robots.txt blocks all crawlers'],
	['sitemap', 'No sitemap'],
	['structured_data', 'No structured data (JSON-LD)'],
	['structured_data_invalid', 'Structured data that is not valid JSON'],
].map(([value, name]) => ({ name, value }));

const show = (operation) => ({ show: { resource: ['website', 'problem'].filter((r) => operation[r]), operation: Object.values(operation).flat() } });

class Triremes {
	constructor() {
		this.description = {
			displayName: 'Triremes',
			name: 'triremes',
			icon: 'file:triremes.svg',
			group: ['transform'],
			version: 1,
			subtitle: '={{ $parameter["operation"] }}',
			description: 'Find business websites with SEO and AEO gaps, and problems people report, on Triremes',
			defaults: { name: 'Triremes' },
			inputs: ['main'],
			outputs: ['main'],
			credentials: [{ name: 'triremesApi', required: true }],
			requestDefaults: {
				baseURL: 'https://triremes.com/api/v1',
				headers: { Accept: 'application/json', 'User-Agent': 'triremes-n8n/1.0' },
			},
			properties: [
				{
					displayName: 'Resource',
					name: 'resource',
					type: 'options',
					noDataExpression: true,
					options: [
						{ name: 'Website', value: 'website' },
						{ name: 'Problem', value: 'problem' },
					],
					default: 'website',
				},
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: { show: { resource: ['website'] } },
					options: [
						{
							name: 'Search Websites',
							value: 'search',
							action: 'Search websites with SEO and AEO gaps',
							description: 'Websites on sale, by business type, place, score and failed check',
							routing: {
								request: { method: 'GET', url: '/website-gaps' },
								output: { postReceive: [{ type: 'rootProperty', properties: { property: 'sites' } }] },
							},
						},
						{
							name: 'Get Website',
							value: 'get',
							action: 'Get a website with SEO and AEO gaps',
							description: 'One website on sale, with every check it passed or failed',
							routing: { request: { method: 'GET', url: '=/website-gaps/{{ $parameter.websiteId }}' } },
						},
					],
					default: 'search',
				},
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: { show: { resource: ['problem'] } },
					options: [
						{
							name: 'Search Problems',
							value: 'searchProblems',
							action: 'Search problems people report',
							description: 'Problems with software and products, as leads or idea reports',
							routing: {
								request: { method: 'GET', url: '/problems' },
								output: { postReceive: [{ type: 'rootProperty', properties: { property: 'problems' } }] },
							},
						},
					],
					default: 'searchProblems',
				},
				{
					displayName: 'Website ID',
					name: 'websiteId',
					type: 'string',
					required: true,
					default: '',
					placeholder: '3f9a1c07b2e85d64',
					description: 'A website\'s ID, as Search Websites gives it',
					displayOptions: show({ website: ['get'] }),
				},
				{
					displayName: 'Limit',
					name: 'limit',
					type: 'number',
					typeOptions: { minValue: 1, maxValue: 50 },
					default: 50,
					description: 'Max number of results to return',
					displayOptions: show({ website: ['search'] }),
					routing: query('limit'),
				},
				{
					displayName: 'Filters',
					name: 'filters',
					type: 'collection',
					placeholder: 'Add Filter',
					default: {},
					displayOptions: show({ website: ['search'] }),
					options: [
						{ displayName: 'Business Type', name: 'category', type: 'string', default: '', placeholder: 'Dentist', routing: query('category') },
						{ displayName: 'Country', name: 'country', type: 'string', default: '', placeholder: 'US', description: 'A two-letter code', routing: query('country') },
						{ displayName: 'State or Region', name: 'region', type: 'string', default: '', placeholder: 'NV', routing: query('region') },
						{ displayName: 'City', name: 'city', type: 'string', default: '', routing: query('city') },
						{
							displayName: 'Keyword',
							name: 'q',
							type: 'string',
							default: '',
							description: 'Words found in the business type, city, region, country or the name of a gap',
							routing: query('q'),
						},
						{ displayName: 'Fails Check', name: 'gap', type: 'options', options: checks, default: 'meta_description', routing: query('gap') },
						{
							displayName: 'SEO Score',
							name: 'score',
							type: 'options',
							options: [
								{ name: 'Catastrophic', value: 'catastrophic' },
								{ name: 'Badly Flawed', value: 'badly-flawed' },
								{ name: 'Flawed', value: 'flawed' },
								{ name: 'Lightly Flawed', value: 'lightly-flawed' },
								{ name: 'No Gaps', value: 'no-gaps' },
							],
							default: 'catastrophic',
							routing: query('score'),
						},
						{ displayName: 'Measured Since', name: 'since', type: 'string', default: '', placeholder: '2026-11-01', routing: query('since') },
						{ displayName: 'Sold at Most', name: 'max_sold', type: 'number', default: 0, description: 'Only websites sold at most this many times', routing: query('max_sold') },
						{ displayName: 'Cursor', name: 'cursor', type: 'string', default: '', description: 'The next_cursor of an earlier search, for its next page', routing: query('cursor') },
					],
				},
				{
					displayName: 'Limit',
					name: 'limit',
					type: 'number',
					typeOptions: { minValue: 1, maxValue: 100 },
					default: 50,
					description: 'Max number of results to return',
					displayOptions: show({ problem: ['searchProblems'] }),
					routing: query('limit'),
				},
				{
					displayName: 'Filters',
					name: 'filters',
					type: 'collection',
					placeholder: 'Add Filter',
					default: {},
					displayOptions: show({ problem: ['searchProblems'] }),
					options: [
						{ displayName: 'Search', name: 'q', type: 'string', default: '', placeholder: 'shopify checkout', routing: query('q') },
						{
							displayName: 'Tier',
							name: 'tier',
							type: 'options',
							options: [
								{ name: 'Tier I · Proven', value: 'A' },
								{ name: 'Tier II · Emerging', value: 'B' },
							],
							default: 'A',
							routing: query('tier'),
						},
						{
							displayName: 'Has Businesses',
							name: 'has_businesses',
							type: 'options',
							options: [
								{ name: 'Leads (With Businesses)', value: 'true' },
								{ name: 'Idea Reports (Without)', value: 'false' },
							],
							default: 'true',
							routing: query('has_businesses'),
						},
						{ displayName: 'Since', name: 'since', type: 'string', default: '', placeholder: '2026-11-01', routing: query('since') },
						{ displayName: 'Sold at Most', name: 'max_sold', type: 'number', default: 0, routing: query('max_sold') },
						{ displayName: 'Cursor', name: 'cursor', type: 'string', default: '', routing: query('cursor') },
					],
				},
			],
		};
	}
}

module.exports = { Triremes };
