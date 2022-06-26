import path from 'node:path';
import fs from 'node:fs';
import _pathExists from 'path-exist';

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

const mkdir = fsp.mkdir;

const pathExists = _pathExists;

export {
	mkdir,
	parsePath,
	unusedFileNameIncrementer,
	readFile,
	writeFile,
	pathExists,
};
