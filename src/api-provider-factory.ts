import {APIProvider, supportedAPIProviders} from './api-provider.js';
import {NotSupportedProviderError} from './errors.js';
import {BackjoonProvider} from './api';

const generateAPIProvider = (provider: string): APIProvider => {
	if (supportedAPIProviders.includes(provider)) {
		throw new NotSupportedProviderError(provider);
	}

	switch (provider) {
		case 'baekjoon':
			return new BackjoonProvider();
		default:
			throw new Error('provider set wrong');
	}
};

export {
	generateAPIProvider,
};
