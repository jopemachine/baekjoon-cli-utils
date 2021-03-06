import process from 'node:process';
import {execa} from 'execa';
import {temporaryFile} from 'tempy';
import {CommandNotAvailableError, RunnerConfigFileNotValidError} from '../errors.js';
import {TestRunner} from '../test-runner.js';
import {isCommandAvailable} from '../utils.js';

interface RustTestRunnerSetting {
	rustEdition: number;
}

const isValidConfig = (runnerSetting: any): runnerSetting is RustTestRunnerSetting => runnerSetting.rustEdition;

class RustTestRunner extends TestRunner {
	constructor(runnerSettings: RustTestRunnerSetting) {
		if (!isValidConfig(runnerSettings)) {
			throw new RunnerConfigFileNotValidError();
		}

		super(runnerSettings);
		this.languageId = 'rust';
	}

	override async compile({sourceFilePath}: {sourceFilePath: string}) {
		if (!await isCommandAvailable('rustc')) {
			throw new CommandNotAvailableError('rustc');
		}

		const temporaryFilePath = temporaryFile();
		await execa('rustc', [`--edition=${String(this.runnerSettings.rustEdition)}`, '-o', temporaryFilePath, sourceFilePath]);
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
	RustTestRunner,
};
