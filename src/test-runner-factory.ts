import {NotSupportedLanguageError} from './errors.js';
import {isSupportedLanguage} from './lang.js';
import {TestRunner} from './test-runner.js';
import {
	CLangTestRunner,
	CppTestRunner,
	GoTestRunner,
	JavascriptTestRunner,
	KotlinTestRunner,
	PythonTestRunner,
	RubyTestRunner,
	RustTestRunner,
	SwiftTestRunner,
} from './runner/index.js';
import {config, readRunnerSettings} from './conf.js';
import {JavaTestRunner} from './runner/java.js';

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
		case 'kotlin':
			return new KotlinTestRunner(runnerSetting);
		case 'swift':
			return new SwiftTestRunner(runnerSetting);
		case 'c':
			return new CLangTestRunner(runnerSetting);
		case 'ruby':
			return new RubyTestRunner(runnerSetting);
		case 'rust':
			return new RustTestRunner(runnerSetting);
		case 'd':
		default:
			throw new Error('lang set wrong');
	}
};

export {
	generateTestRunner,
};
