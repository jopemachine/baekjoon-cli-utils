import {NotSupportedLanguageError} from './errors.js';
import {isSupportedLanguage} from './lang.js';
import {TestRunner} from './test-runner.js';
import {CppTestRunner} from './runner/index.js';

const generateTestRunner = (lang: string): TestRunner => {
	if (!isSupportedLanguage(lang)) {
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
