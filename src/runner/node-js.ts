import nvexeca from 'nvexeca';
import {TestRunner} from '../test-runner.js';

interface NodeJsTestRunnerSetting {
	nodeVersion: number | string;
}

const isValidConfig = (runnerSetting: any): runnerSetting is NodeJsTestRunnerSetting => runnerSetting.nodeVersion;

class NodejsRunner extends TestRunner {
	constructor(runnerSettings: any) {
		if (!isValidConfig(runnerSettings)) {
			throw new Error('Runner Config file not valid!');
		}

		super(runnerSettings);
		this.languageId = 'js';
	}

	override async execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		const {childProcess} = await nvexeca(String(this.runnerSettings.nodeVersion), 'node', [targetFilePath], {input: stdin, timeout: this.timeout});
		return childProcess!;
	}
}

export {
	NodejsRunner,
};
