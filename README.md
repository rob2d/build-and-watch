# Getting Started #

These tools are created with NodeJS. To begin usage, make sure you have installed:

- NodeJS 6.X +
- NPM3 +
- [GBDK](http://gbdk.sourceforge.net/)

Once you have these requirements, be sure to:
1) configure your PATH variables to include the `/bin` folder of your GBDK.
2) build NodeJS dependencies by going into your cloned repo's root folder and running:
```
npm install
```

# The Tools #

## Build & Watch ##

Build & Watch is a Gameboy ROM development workflow tool which watches a folder for changes to .c or .h files, builds your Gameboy ROM `.gb` file, and then conveniently launches an emulator of your choice with the updated ROM while closing older instances.

### Usage ###

Be sure to configure the relevant parameters in `config.json`, go to your cloned repo directory, and then simply run:

```
node buildandwatch
```

## 0bto0x ##

0bto0x is a simple script which converts text within a file that contains `0b{binaryValue}` to `0x{hexValue}`. This is to make it easier to edit sprites or background tiles manually with the C formatted hex values needed by GBDK as necessary.

### Usage ###

Go to the cloned repo root directory and simply run

```
node 0bto0x --input=yourfile.txt --output=outputfile.txt
```


# Contributing #

PR requests welcome. Please be reasonable with issue reports, and use stack exchange if it is simple for a technical question vs an actual issue. This repo has been created and tested exclusively on Windows 10 so far, so I'm hoping to get some feedback from people on other OS/distros.

# Note #

This is a work in progress. As such, there are likely to be things that can be improved, and this repo is in a phase of active development. Your support is greatly appreciated throughout this process.

Thanks!