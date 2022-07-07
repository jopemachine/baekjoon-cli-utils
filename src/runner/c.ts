import process from 'node:process';
import {execa} from 'execa';
import {temporaryFile} from 'tempy';
import {CommandNotAvailableError, RunnerConfigFileNotValidError} from '../errors.js';
import {TestRunner} from '../test-runner.js';
import {isCommandAvailable} from '../utils.js';

interface CLangTestRunnerSetting {
	compiler: string;
	std: string;
}

const isValidConfig = (runnerSetting: any): runnerSetting is CLangTestRunnerSetting => runnerSetting.compiler && runnerSetting.std;

class CLangTestRunner extends TestRunner {
	constructor(runnerSettings: CLangTestRunnerSetting) {
		if (!isValidConfig(runnerSettings)) {
			throw new RunnerConfigFileNotValidError();
		}

		super(runnerSettings);
		this.languageId = 'c';
	}

	override async compile({sourceFilePath}: {sourceFilePath: string}) {
		if (!await isCommandAvailable(this.runnerSettings.compiler)) {
			throw new CommandNotAvailableError(this.runnerSettings.compiler);
		}

		const temporaryFilePath = temporaryFile();
		await execa(this.runnerSettings.compiler, [`--std=${this.runnerSettings.std}`, `--output=${temporaryFilePath}`, sourceFilePath]);
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
	CLangTestRunner,
};
