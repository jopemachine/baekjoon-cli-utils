import {execa} from 'execa';
import {temporaryFile} from 'tempy';
import {TestRunner} from '../test-runner.js';

interface CLangTestRunnerSetting {
	compiler: string;
	std: string;
}

const isValidConfig = (runnerSetting: any): runnerSetting is CLangTestRunnerSetting => runnerSetting.compiler && runnerSetting.std;

class CLangTestRunner extends TestRunner {
	constructor(runnerSettings: CLangTestRunnerSetting) {
		if (!isValidConfig(runnerSettings)) {
			throw new Error('Runner Config file not valid!');
		}

		super(runnerSettings);
		this.languageId = 'c';
	}

	override async compile({sourceFilePath}: {sourceFilePath: string}) {
		const temporaryFilePath = temporaryFile();
		await execa(this.runnerSettings.compiler, [`--std=${this.runnerSettings.std}`, `--output=${temporaryFilePath}`, sourceFilePath]);
		return temporaryFilePath;
	}

	override execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		const childProc = execa(targetFilePath, {input: stdin, timeout: this.timeout});
		return childProc;
	}
}

export {
	CLangTestRunner,
};
