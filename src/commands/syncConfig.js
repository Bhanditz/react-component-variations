import chalk from 'chalk';
import vm from 'vm';
import has from 'has';
import { readFileSync } from 'fs';

import normalizeConfig from '../helpers/normalizeConfig';
import validateProjects from '../helpers/validateProjects';
import validateProject from '../helpers/validateProject';

function scriptExecutionPromise(scriptPath) {
  return new Promise((resolve, reject) => {
    const script = new vm.Script(readFileSync(scriptPath, 'utf8'));

    try {
      vm.runInContext(script);
    } catch (error) {
      reject(chalk.red(error));
    }
    resolve();
  });
}

function sync(config) {
  return Promise.all(config.map(path => scriptExecutionPromise(path)));
}

export const command = 'sync';
export const desc = 'Sync variation consumers.';
export const builder = (yargs) => {
  const config = normalizeConfig(yargs.argv);
  const { project, projects, all } = config;
  const allProjectNames = projects ? Object.keys(projects) : [];

  if (all && allProjectNames.length <= 0) {
    throw chalk.red('`--all` requires a non-empty “projects” config');
  }
  if (all && project) {
    throw chalk.red('`--all` and `--project` are mutually exclusive');
  }
  if (project && !has(projects, project)) {
    throw chalk.red(`Project "${project}" missing from “projects” config`);
  }

  if (projects) {
    validateProjects(projects, allProjectNames, 'in the “projects” config');
  } else {
    validateProject(config);
  }
};

export const handler = (yargs) => {
  const config = normalizeConfig(yargs.argv);
  if (config.sync.length) {
    sync(config.sync).then(() => {
      console.log(chalk.green('Sync complete'));
    });
  }
};
