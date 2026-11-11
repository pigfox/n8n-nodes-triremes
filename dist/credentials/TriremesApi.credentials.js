'use strict';

// The Triremes API key, sent as "Authorization: Bearer <key>" to
// triremes.com only; n8n stores it encrypted, never in a workflow.
class TriremesApi {
	constructor() {
		this.name = 'triremesApi';
		this.displayName = 'Triremes API';
		this.documentationUrl = 'https://triremes.com/api';
		this.properties = [
			{
				displayName: 'API Key',
				name: 'apiKey',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				required: true,
				description: 'Your key from triremes.com/account/api',
			},
		];
		this.authenticate = {
			type: 'generic',
			properties: {
				headers: {
					Authorization: '=Bearer {{$credentials.apiKey}}',
				},
			},
		};
		// The balance is the cheapest call that proves a key.
		this.test = {
			request: {
				baseURL: 'https://triremes.com/api/v1',
				url: '/balance',
				headers: { 'User-Agent': 'triremes-n8n/1.0' },
			},
		};
	}
}

module.exports = { TriremesApi };
