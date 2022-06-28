import {execa} from 'execa';
import {TestRunner} from '../test-runner.js';

interface PythonTestRunnerSetting {}

const isValidConfig = (runnerSetting: any): runnerSetting is PythonTestRunnerSetting => true;

class PythonTestRunner extends TestRunner {
	constructor(runnerSettings: PythonTestRunnerSetting) {
		if (!isValidConfig(runnerSettings)) {
			throw new Error('Runner Config file not valid!');
		}

		super(runnerSettings);
		this.languageId = 'python';
	}

	override execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		const childProc = execa('python3', [targetFilePath], {input: stdin, timeout: this.timeout});
		return childProc;
	}
}

export {
	PythonTestRunner,
};
