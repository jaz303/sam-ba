# sam-ba

Work-in-progress Node.js port of ShumaTech's [BOSSA](https://github.com/shumatech/BOSSA).

## Current Status

  - Ability to read device ID
  - Mostly-working CLI for flash reading/writing (some bugs)
  - Support for reading device settings from user row

USB is untested (although faithfully ported). Expect bugs here. NB "USB" means native USB, not USB-serial bridges (which __are__ tested).

### Things that are outstanding

At present only the `D2xNvmFlash` flash implementation is ported (and extended to support the `SAMC2x` series). Ports of the following flash implementations are outstanding:

  - `D5xNvmFlash`
  - `EefcFlash`
  - `EfcFlash`


If you want to use `sam-ba` in your project...

## What this project is

`sam-ba` is designed as a library for applications that need to __embed their own firmware update facilities__, supplying their own interface.

## What this project is not

`sam-ba` is not intended to be a general purpose end-user bootloader interface, although a CLI tool may follow in the future - most likely as a separate package. A general purpose GUI is not on the roadmap.

## Device Support

### ATSAMC2x

Should work. Tested devices:

  - `ATSAMC20J18A` - in-development

### ATSAMD2x

Should work.

## Basic Usage

### Reading Flash

```javascript


```

### Writing Flash

```javascript


```

## Adding Chip Support

