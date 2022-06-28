import {NotSupportedLanguageError} from './errors.js';
import {isSupportedLanguage} from './lang.js';
import {TestRunner} from './test-runner.js';
import {CppTestRunner, NodejsRunner} from './runner/index.js';
import {config, readRunnerSettings} from './conf.js';

const generateTestRunner = async (lang: string): Promise<TestRunner> => {
	if (!isSupportedLanguage(lang)) {
		throw new NotSupportedLanguageError(lang);
	}

	const runnerSetting = (await readRunnerSettings())[config.get('lang')];

	switch (lang) {
		case 'cpp':
			return new CppTestRunner(runnerSetting);
		case 'js':
			return new NodejsRunner(runnerSetting);
		default:
			throw new Error('lang set wrong');
	}
};

export {
	generateTestRunner,
};
