#!/usr/bin/env node
'use strict';

require('dotenv').config();

const chalk = require('chalk');
const cliApp = require('commander');
const loadJsonFile = require('load-json-file');
const path = require('path');
const pkg = require('./../package.json');
const BitbucketServerApi = require('bitbucket-server-api');

/**
 * Error handler
 * @param  {String}     err   Error message
 * @return {undefined}        No return
 */
const handleError = function(err) {
  const exitCode = 1;

  console.log(chalk.red.bold(err));
  process.exitCode = exitCode;
};

/**
 * Validates required parameters
 *
 * @param {String} baseUrl  Base url cli parameter
 * @param {String} username Username cli parameter
 * @param {String} password Password cli parameter
 * @return {undefined} No return
 */
const validGlobalRequiredParams = function(baseUrl, username, password) {
  // Base URL
  if (typeof baseUrl !== 'string' || baseUrl === '') {
    handleError('Bitbucket Server Base URL is required.');
  }

  // Username
  if (typeof username !== 'string' || username === '') {
    handleError('Bitbucket Server Username is required.');
  }

  // Password
  if (typeof password !== 'string' || password === '') {
    handleError('Bitbucket Server Password is required.');
  }
};

const completeMessage = chalk.green.bold('bitbucket-server-cli completed successfully');
const baseUrl = process.env.BITBUCKET_BASE_URL;
const username = process.env.BITBUCKET_USERNAME;
const password = process.env.BITBUCKET_PASSWORD;

validGlobalRequiredParams(baseUrl, username, password);

// configure cli options
cliApp.version(pkg.version);
cliApp.usage(pkg.name);
cliApp.option('-p, --projects <projects>', 'Comma separated list of projects');

cliApp
  .command('audit-permissions')
  .alias('ap')
  .description('Audit permissions')
  .option('-c, --configFile <configFile>', 'Path to config file')
  .action(function(options) {
    const apiClient = new BitbucketServerApi(baseUrl, username, password);
    const pluginOptions = loadJsonFile.sync(path.join(process.cwd(), options.configFile));

    pluginOptions.projects = cliApp.projects.split(',');
    const PermissionsPlugin = require('./plugins/permissions/PermissionsPlugin');
    const permissionsPlugin = new PermissionsPlugin(apiClient, pluginOptions);

    permissionsPlugin.execute().then((result) => {
      console.log(chalk.bold.green(result));
      console.log(completeMessage);
    }).catch((error) => {
      handleError(error);
    });
  });

cliApp
  .command('stale-prs')
  .alias('sp')
  .description('Fetch a list of Stale PRs')
  .option('-s, --definitionOfStale <definitionOfStale>', 'Definition of stale')
  .action(function(options) {
    const apiClient = new BitbucketServerApi(baseUrl, username, password);

    const StalePrs = require('./plugins/stale-prs/StalePrPlugin');
    const pluginOptions = {
      definitionOfStale: options.definitionOfStale,
      projects: cliApp.projects.split(',')
    };
    const stalePrsPlugin = new StalePrs(apiClient, pluginOptions);

    stalePrsPlugin.execute().then((result) => {
      console.log(chalk.bold.green(result));
      console.log(completeMessage);
    }).catch((error) => {
      handleError(error);
    });
  });

cliApp
  .command('pr-stats')
  .alias('s')
  .description('Fetch PRs stats')
  .option('-s, --startDate <startDate>', 'Start date stats range')
  .option('-e, --endDate <endDate>', 'End date stats range')
  .option('-r, --range <range>', 'Relative time range')
  .action(function(options) {
    const apiClient = new BitbucketServerApi(baseUrl, username, password);
    const PullRequestStatsPlugin = require('./plugins/stats/PullRequestStatsPlugin');
    const pluginOptions = {
      startDate: options.startDate,
      endDate: options.endDate,
      relativeRange: options.range,
      projects: cliApp.projects.split(',')
    };
    const pullRequestStatsPlugin = new PullRequestStatsPlugin(apiClient, pluginOptions);

    pullRequestStatsPlugin.execute().then((result) => {
      console.log(chalk.bold.green(result));
      console.log(completeMessage);
    }).catch((error) => {
      handleError(error);
    });
  });

cliApp.parse(process.argv);
