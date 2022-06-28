import path from 'node:path';
import {execa} from 'execa';
import {temporaryDirectory} from 'tempy';
import {TestRunner} from '../test-runner.js';
import {cpFile} from '../utils.js';

interface KotlinTestRunnerSetting {
}

const isValidConfig = (runnerSetting: any): runnerSetting is KotlinTestRunnerSetting => true;

class KotlinTestRunner extends TestRunner {
	constructor(runnerSettings: KotlinTestRunnerSetting) {
		if (!isValidConfig(runnerSettings)) {
			throw new Error('Runner Config file not valid!');
		}

		super(runnerSettings);
		this.languageId = 'kotlin';
	}

	override async compile({sourceFilePath}: {sourceFilePath: string}) {
		const temporaryDirPath = temporaryDirectory();
		const temporaryFilePath = path.resolve(temporaryDirPath, 'Main.kt');
		await cpFile(sourceFilePath, temporaryFilePath);
		await execa('kotlinc-jvm', ['-include-runtime', '-d', 'Main.jar', 'Main.kt']);
		return path.resolve(temporaryDirPath, 'Main.jar');
	}

	override execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		const childProc = execa('java', ['-Dfile.encoding=UTF-8', '-XX:+UseSerialGC', '-jar', path.parse(targetFilePath).dir, 'Main.jar'], {input: stdin});
		return childProc;
	}
}

export {
	KotlinTestRunner,
};
