import path from 'node:path';
import fs from 'node:fs';
import logSymbols from 'log-symbols';
import _pathExists from 'path-exist';
import {unusedFilename} from 'unused-filename';

const fsp = fs.promises;

const unusedFileNameIncrementer = (filename: string, extension: string): [string, string] => {
	const match: any = /^(?<index>\d+)_(?<originalFilename>.*)$/.exec(filename);
	let {originalFilename, index} = match ? match.groups : {originalFilename: filename, index: 2};
	originalFilename = originalFilename.trim();
	return [`${originalFilename}${extension}`, `${originalFilename}_${++index}${extension}`];
};

const parsePath = (targetPath: string) => {
	const [id, idx] = path.parse(targetPath).name.split('_');
	return {id, idx: Number(idx)};
};

const readFile = async (filepath: string) => fsp.readFile(filepath, {encoding: 'utf-8'});

const writeFile = async (filepath: string, data: any) => fsp.writeFile(filepath, data, {encoding: 'utf-8'});

const Logger = {
	log: console.log,
	successLog(message: string) {
		console.log(`${logSymbols.success} ${message}`);
	},
	warningLog(message: string) {
		console.log(`${logSymbols.warning} ${message}`);
	},
	infoLog(message: string) {
		console.log(`${logSymbols.info} ${message}`);
	},
	errorLog(message: string) {
		console.log(`${logSymbols.error} ${message}`);
	},
};

const getUnusedFilename = async (filePath: string) => unusedFilename(filePath, {incrementer: unusedFileNameIncrementer});

const mkdir = fsp.mkdir;

const pathExists = _pathExists;

export {
	mkdir,
	parsePath,
	getUnusedFilename,
	unusedFileNameIncrementer,
	readFile,
	writeFile,
	pathExists,
	Logger,
};
