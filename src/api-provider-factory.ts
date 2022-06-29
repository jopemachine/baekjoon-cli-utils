import {APIProvider, supportedAPIProviders} from './api-provider.js';
import {NotSupportedProviderError} from './errors.js';
import {BaekjoonProvider} from './api/index.js';

const generateAPIProvider = (provider: string): APIProvider => {
	if (!supportedAPIProviders.includes(provider)) {
		throw new NotSupportedProviderError(provider);
	}

	switch (provider) {
		case 'baekjoon':
			return new BaekjoonProvider();
		default:
			throw new Error('provider config wrong');
	}
};

export {
	generateAPIProvider,
};
