#!/usr/bin/env node
'use strict';

const ArgumentParser = require('argparse').ArgumentParser;

const parser = new ArgumentParser({
    version: '1.0.0',
    addHelp: true,
    description: 'Cryptelligence: Cryptocurrency market sentiment tools.'
  });
  
  

const args = parser.parseArgs();

module.exports = {
    args: args
};