import process from 'node:process';
import inquirer from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';
import isFirstRun from 'first-run';
import {checkHealth, setProgrammingLanguage, setCommentTemplate, setSourceCodeTemplate, config, setAPIProvider, initConfigFilePaths, projectName} from './conf.js';
import {APIProvider} from './api-provider.js';
import {generateAPIProvider} from './api-provider-factory.js';
import {generateTestRunner} from './test-runner-factory.js';
import {TestRunner} from './test-runner.js';
import {Problem} from './problem.js';
import {ArgumentLengthError} from './errors.js';
import {findProblemPath, parsePath} from './utils.js';

inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);

const command = process.argv[2];
const subCommand = command === 'set' && process.argv.length > 3 ? process.argv[3] : undefined;

const checkArgumentLength = (command: string, subCommand?: string) => {
	const expectedLengthDict = {
		'set lang': 3,
		'set provider': 3,
		'set code': 2,
		'set comment': 2,
		create: 2,
		'clear-test': 3,
		open: 2,
		commit: 2,
	};

	const id = subCommand ? `${command} ${subCommand}` : command;

	// Argv0, Argv1 are excluded from counting.
	if ((expectedLengthDict as any)[id] && process.argv.length - 2 !== (expectedLengthDict as any)[id]) {
		throw new ArgumentLengthError({
			expectedLength: (expectedLengthDict as any)[id],
			actualLength: process.argv.length - 2,
		});
	}
};

(async function () {
	try {
		if (isFirstRun({name: projectName})) {
			await initConfigFilePaths();
		}

		checkArgumentLength(command, subCommand);

		if (command === 'set') {
			const target = process.argv[3];

			switch (target) {
				case 'lang':
					setProgrammingLanguage(process.argv[4]);
					break;
				case 'provider':
					setAPIProvider(process.argv[4]);
					break;
				case 'code':
					await setSourceCodeTemplate();
					break;
				case 'comment':
					await setCommentTemplate();
					break;
				default:
					throw new Error(`Unknown Config Name '${target}'`);
			}
		} else {
			await checkHealth();

			let testIdx;
			const problemNumber = process.argv[3];
			const provider: APIProvider = generateAPIProvider(config.get('provider'));
			const testRunner: TestRunner = generateTestRunner(config.get('lang'));
			const problem = new Problem({problemId: problemNumber});

			switch (command) {
				case 'create':
					await provider.createProblem(problem);
					break;
				case 'run':
				case 'test':
					testIdx = process.argv.length > 4 ? Number(process.argv[4]) : undefined;
					const sourceFilePath = await findProblemPath(problem.problemId);
					const {idx: problemIdx} = parsePath(sourceFilePath);
					problem.problemIdx = problemIdx;
					await testRunner.run({sourceFilePath, problem, testIdx});
					break;
				case 'add-test':
					await problem.addManualTest();
					break;
				case 'clear-tests':
					await problem.clearTests();
					break;
				case 'clear-test':
					testIdx = Number(process.argv[4]);
					await problem.clearTest(testIdx);
					break;
				case 'open':
					await provider.openProblem(problem);
					break;
				case 'commit':
					await provider.commitProblem(problem);
					break;
				default:
					throw new Error('Unknown Command');
			}
		}
	} catch (error: any) {
		console.error(error);
	}
})();
