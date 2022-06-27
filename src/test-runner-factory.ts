import {NotSupportedLanguageError} from './errors.js';
import {supportedLanguages} from './lang.js';
import {TestRunner} from './test-runner.js';
import {CppTestRunner} from './runner';

const generateTestRunner = (lang: string): TestRunner => {
	if (Object.keys(supportedLanguages).includes(lang)) {
		throw new NotSupportedLanguageError(lang);
	}

	switch (lang) {
		case 'cpp':
			return new CppTestRunner();
		default:
			throw new Error('lang set wrong');
	}
};

export {
	generateTestRunner,
};
