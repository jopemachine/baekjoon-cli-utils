import process from 'node:process';
import {execa} from 'execa';
import {CommandNotAvailableError, RunnerConfigFileNotValidError} from '../errors.js';
import {TestRunner} from '../test-runner.js';
import {isCommandAvailable} from '../utils.js';

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

	override async execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		if (!await isCommandAvailable('ruby')) {
			throw new CommandNotAvailableError('ruby');
		}

		const childProc = execa('ruby', [targetFilePath], {input: stdin, timeout: this.timeout});
		if (this.rawMode) {
			childProc.stdout!.pipe(process.stdout);
		}

		return childProc;
	}
}

export {
	RubyTestRunner,
};
