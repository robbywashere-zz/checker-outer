# Checker-outer

## Motivation / Abstract

Checker-outer easily makes a git repo from a package specified in your projects `package.json`

The package must be specified as a github url, ie : `git+ssh://git@github.com/robbywashere/checker-outer.git#master`

The hash specifying the "commit-ish" is optional


## Install

`$>npm install -g http://github.com/robbywashere/checker-outer`

## Setup

for bash completion add the following to your .bashrc or .bash_profile

`source <install directory>/checker-outer.bash`

## Usage

_In your target project's repo_

First do an `npm install`

To checkout all `git://` specified modules, 

`$>checker-outer`

or for a specific one:

`$>checker-outer <package-name>`




