import {NotSupportedLanguageError} from './errors.js';
import {isSupportedLanguage} from './lang.js';
import {TestRunner} from './test-runner.js';
import {CppTestRunner, GoTestRunner, JavascriptTestRunner, PythonTestRunner} from './runner/index.js';
import {config, readRunnerSettings} from './conf.js';
import {JavaTestRunner} from './runner/java.js';

49;

const generateTestRunner = async (lang: string): Promise<TestRunner> => {
	if (!isSupportedLanguage(lang)) {
		throw new NotSupportedLanguageError(lang);
	}

	const runnerSetting = (await readRunnerSettings())[config.get('lang')];

	switch (lang) {
		case 'cpp':
			return new CppTestRunner(runnerSetting);
		case 'javascript':
			return new JavascriptTestRunner(runnerSetting);
		case 'python':
			return new PythonTestRunner(runnerSetting);
		case 'go':
			return new GoTestRunner(runnerSetting);
		case 'java':
			return new JavaTestRunner(runnerSetting);
		case 'c#':
		case 'kotlin':
		case 'swift':
		case 'd':
		case 'c':
		case 'ruby':
		case 'rust':

		default:
			throw new Error('lang set wrong');
	}
};

export {
	generateTestRunner,
};
