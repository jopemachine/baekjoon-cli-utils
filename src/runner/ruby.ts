import {execa} from 'execa';
import {RunnerConfigFileNotValidError} from '../errors.js';
import {TestRunner} from '../test-runner.js';

interface RubyTestRunnerSetting {
}

const isValidConfig = (runnerSetting: any): runnerSetting is RubyTestRunnerSetting => true;

class RubyTestRunner extends TestRunner {
	constructor(runnerSettings: any) {
		if (!isValidConfig(runnerSettings)) {
			throw new RunnerConfigFileNotValidError();
		}

		super(runnerSettings);
		this.languageId = 'ruby';
	}

	override execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		const childProcess = execa('ruby', [targetFilePath], {input: stdin, timeout: this.timeout});
		return childProcess;
	}
}

export {
	RubyTestRunner,
};
