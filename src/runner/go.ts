import process from 'node:process';
import {execa} from 'execa';
import {temporaryFile} from 'tempy';
import {CommandNotAvailableError, RunnerConfigFileNotValidError} from '../errors.js';
import {TestRunner} from '../test-runner.js';
import {isCommandAvailable} from '../utils.js';

interface GoLangTestRunnerSetting {
}

const isValidConfig = (runnerSetting: any): runnerSetting is GoLangTestRunnerSetting => true;

class GoTestRunner extends TestRunner {
	constructor(runnerSettings: GoLangTestRunnerSetting) {
		if (!isValidConfig(runnerSettings)) {
			throw new RunnerConfigFileNotValidError();
		}

		super(runnerSettings);
		this.languageId = 'go';
	}

	override async compile({sourceFilePath}: {sourceFilePath: string}) {
		if (!await isCommandAvailable('go')) {
			throw new CommandNotAvailableError('go');
		}

		const temporaryFilePath = temporaryFile();
		await execa('go', ['build', '-o', temporaryFilePath, sourceFilePath]);
		this.resources.push(temporaryFilePath);
		return temporaryFilePath;
	}

	override async execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		const childProc = execa(targetFilePath, {input: stdin, timeout: this.timeout});
		if (this.rawMode) {
			childProc.stdout!.pipe(process.stdout);
		}

		return childProc;
	}
}

export {
	GoTestRunner,
};
