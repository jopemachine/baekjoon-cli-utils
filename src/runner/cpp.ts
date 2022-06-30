import {execa} from 'execa';
import {temporaryFile} from 'tempy';
import {RunnerConfigFileNotValidError} from '../errors.js';
import {TestRunner} from '../test-runner.js';

interface CppTestRunnerSetting {
	compiler: string;
	std: string;
}

const isValidConfig = (runnerSetting: any): runnerSetting is CppTestRunnerSetting => runnerSetting.compiler && runnerSetting.std;

class CppTestRunner extends TestRunner {
	constructor(runnerSettings: CppTestRunnerSetting) {
		if (!isValidConfig(runnerSettings)) {
			throw new RunnerConfigFileNotValidError();
		}

		super(runnerSettings);
		this.languageId = 'cpp';
	}

	override async compile({sourceFilePath}: {sourceFilePath: string}) {
		const temporaryFilePath = temporaryFile();
		await execa(this.runnerSettings.compiler, [`--std=${this.runnerSettings.std}`, `--output=${temporaryFilePath}`, sourceFilePath]);
		this.resources.push(temporaryFilePath);
		return temporaryFilePath;
	}

	override execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		const childProc = execa(targetFilePath, {input: stdin, timeout: this.timeout});
		return childProc;
	}
}

export {
	CppTestRunner,
};
