#!/usr/bin/env node
const request = require('request');
const async = require('async');
const fs = require('fs');
const path = require('path');

const usage = `
b-git-checkout [-h][-f]
  -h - this help
  -f - clears the cache
`
const argv = require('minimist')(process.argv.slice(2), {
  alias: {
    h: 'help',
    f: 'force'
  },
  boolean: ['help', 'force']
});

if (argv.help) {
  console.log(usage);
  process.exit();
}

const apiHost = 'blurb-books.atlassian.net';
const apiUsername = 'smccollum';
const apiPassword = 'pLCV5rfvr6Cj2dpkyhGT';

const cacheLocation = (process.env.TMP || '/tmp') + '/.b-git-checkout-b-cache.json';
if (argv.force) {
  fs.unlinkSync(cacheLocation);
}

let cache = {
  timeSearched: null,
  matchingKeys: [],
  keyToSummary: {}
};

const loadCache = () => {
  if (fs.existsSync(cacheLocation)) {
    try {
      cache = require(cacheLocation);
    } catch (e) {
      fs.unlinkSync(cacheLocation);
    }
  }
};
const saveCache = () => {
  fs.writeFileSync(cacheLocation, JSON.stringify(cache, null, 3));
}
const convertIssueToBranchName = (key) => {
  const summary = cache.keyToSummary[key];
  return `${key.replace(/[^a-z0-9]+/gi, '_')}` +
    '_' +
    `${summary.replace(/[^a-z0-9]+/gi, '_')}`
}

// https://docs.atlassian.com/jira/REST/cloud/#api/2/search-search
const search = (callback, startAt=0, matchingKeys=[]) => {
  const jql = `project = 'WEB' and status = Resolved and assignee = "${apiUsername}"`;
  const apiPath = '/rest/api/2/search';
  request({
    url: `https://${apiUsername}:${apiPassword}@${apiHost}${apiPath}`,
    method: 'POST',
    json: {
      jql,
      startAt,
      maxResults: 15,
      fields: [
        "summary"
      ],
      fieldsByKeys: false      
    }
  }, function (error, response, body) {
    if (error) {
      callback(error);
      return;
    }
    // console.log('status', response.statusCode)
    // console.log(JSON.stringify(body, null, 3));

    body.issues.forEach(({ key, fields}) => {
      const {summary} = fields;
      matchingKeys.push(key);
      cache.keyToSummary[key] = summary;
    })

    if (body.total > body.maxResults) {
      search(callback, startAt + body.maxResults, matchingKeys);
    } else {
      cache.matchingKeys = matchingKeys;
      cache.timeSearched = Date.now();
      callback(null, matchingKeys);
    }
  });
}

const SECOND_TO_MS = 1000;
const MINUTE_TO_MS = 60 * SECOND_TO_MS;
const HOUR_TO_MS = 60 * MINUTE_TO_MS;
const DAY_TO_MS = 24 * HOUR_TO_MS;

const searchIfNeeded = (callback) => {
  if (!cache.timeSearched) {
    search(callback);
    return;
  }
  const dateTimeSearched = new Date(cache.timeSearched);
  const now = new Date();
  const msElapsed = now.getTime() - dateTimeSearched.getTime();
  if (msElapsed > 3 * HOUR_TO_MS) {
    search(callback);
  } else {
    callback(null, cache.matchingKeys);
  }
}

loadCache();

searchIfNeeded((error, matchingKeys) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  saveCache();
  matchingKeys.forEach((key) => {
    console.log( convertIssueToBranchName(key) );
  });
});