import process from 'node:process';
import cleanStack from 'clean-stack';
import {checkHealth, setProgrammingLanguage, setCommentTemplate, setSourceCodeTemplate, config} from './conf.js';
import { APIProvider } from './api-provider.js';
import { generateAPIProvider } from './api-provider-factory.js';
import { generateTestRunner } from './test-runner-factory.js';
import { TestRunner } from './test-runner.js';
import { Problem } from './problem.js';
import { ArgumentLengthError } from './errors.js';

const command = process.argv[2];

(async function () {
	try {
		if (command === 'set') {
			const target = process.argv[3];

			switch (target) {
				case 'lang':
					setProgrammingLanguage(process.argv[4]);
					break;
				case 'code':
					await setSourceCodeTemplate();
					break;
				case 'comment':
					await setCommentTemplate();
					break;
				default:
					throw new Error('Unknown Config');
			}
		} else {
			checkHealth();
			let testIdx;
			const problemNumber = process.argv[3];
			const provider: APIProvider = generateAPIProvider(config.get('provider'));
			const testRunner: TestRunner = generateTestRunner(config.get('lang'));
			const problem = new Problem({problemId: problemNumber});

			switch (command) {
				case 'create':
					provider.createProblem(problem);
					break;
				case 'run':
				case 'test':
					testIdx = process.argv.length > 4 ? Number(process.argv[4]) : undefined;

					// testRunner.run({, problem, testIdx});
					break;
				case 'add-test':
					problem.addManualTest();
					break;
				case 'clear-tests':
					problem.clearTests();
					break;
				case 'clear-test':
					if (process.argv.length < 4) throw new ArgumentLengthError({expectedLength: 4, actualLength: process.argv.length});
					testIdx = Number(process.argv[4]);
					problem.clearTest(testIdx);
					break;
				case 'open':
					provider.openProblem(problem);
					break;
				case 'commit':
					provider.commitProblem(problem);
					break;
				default:
					throw new Error('Unknown Command');
			}
		}
	} catch (error: any) {
		cleanStack(error.stack);
	}
})();
