import path from 'node:path';
import process from 'node:process';
import {execa} from 'execa';
import {temporaryDirectory} from 'tempy';
import {TestRunner} from '../test-runner.js';
import {cpFile, isCommandAvailable} from '../utils.js';
import {CommandNotAvailableError, RunnerConfigFileNotValidError} from '../errors.js';

interface KotlinTestRunnerSetting {
}

const isValidConfig = (runnerSetting: any): runnerSetting is KotlinTestRunnerSetting => true;

class KotlinTestRunner extends TestRunner {
	constructor(runnerSettings: KotlinTestRunnerSetting) {
		if (!isValidConfig(runnerSettings)) {
			throw new RunnerConfigFileNotValidError();
		}

		super(runnerSettings);
		this.languageId = 'kotlin';
	}

	override async compile({sourceFilePath}: {sourceFilePath: string}) {
		if (!await isCommandAvailable('kotlinc-jvm')) {
			throw new CommandNotAvailableError('kotlinc-jvm');
		}

		const temporaryDirPath = temporaryDirectory();
		const temporaryFilePath = path.resolve(temporaryDirPath, 'Main.kt');
		await cpFile(sourceFilePath, temporaryFilePath);
		await execa('kotlinc-jvm', ['-include-runtime', '-d', 'Main.jar', 'Main.kt']);
		this.resources.push(temporaryDirPath);
		return path.resolve(temporaryDirPath, 'Main.jar');
	}

	override async execute({stdin, targetFilePath}: {stdin: string; targetFilePath: string}) {
		const childProc = execa('java', ['-Dfile.encoding=UTF-8', '-XX:+UseSerialGC', '-jar', path.parse(targetFilePath).dir, 'Main.jar'], {input: stdin});
		if (this.rawMode) {
			childProc.stdout!.pipe(process.stdout);
		}

		return childProc;
	}
}

export {
	KotlinTestRunner,
};
