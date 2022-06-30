import test from 'ava';
import {pathExists} from 'path-exists';
import del from 'del';
import {generateAPIProvider} from '../../dist/api-provider-factory.js';
import {Problem} from '../../dist/problem.js';

test.before('', t => {
	t.context.provider = generateAPIProvider('baekjoon');
	t.context.resources = [];
});

test.after(async t => {
	await Promise.all(t.context.resources.map(resource => del(resource, {force: true})));
});

test('Create problem', async t => {
	const problem = new Problem({
		problemId: '1000',
		problemPathId: 'test!1000',
	});

	const pathToSave = './1000.cpp';
	t.context.resources.push(pathToSave);
	await t.notThrowsAsync(problem.clearTests());
	problem.generateTestFolder();
	await t.notThrowsAsync(t.context.provider.createProblem(pathToSave, problem, 'cpp'));
	t.true(await pathExists(pathToSave));
});
