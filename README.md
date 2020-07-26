# sam-ba

## Installation

```
$ npm install -g @jaz303/sam-ba-cli
```

## Basic Usage

```
$ sam-ba <options> command <command args>
```

## Options

  - `-p`, `--port`: serial port
  - `-b`, `--baud`: baud rate
  - `-a`, `--address`: read/write/erase address; can be specified as hex or decimal
  - `-l`, `--length`: number of bytes to read; can be specified as hex or decimal
  - `--reset`: reset device after command complete; applies to `write` command
  - `--json`: request JSON output; currently supported for `info` and `settings` commands
  - `--debug`: enable debug output (very chatty)

For all commands that connect to the device, serial port must be specified, either via `-p`/`--port`, or alternatively, the environment variable `SAM_BA_SERIAL_PORT` may be set. Baud rate defaults to 115200.

## Commands

### `info`

Display device info (e.g. name, family, flash parameters).

### `settings`

Display device settings including lock regions, BOR/BOD configuration, and more. The available settings vary per device.

### `read <file>`

Read flash from device and write to a local file.

Arguments:

  - `file`: output filename

Supported options:

  - `-a`, `--address`: optional; read start address (default: `0x0`) (must be page-aligned)
  - `-l`, `--length`: optional; number of bytes to read (default: read to end of flash)

### `write <file>`

Write device flash with data read from a local file.

Arguments:

  - `file`: source file

Supported options:

  - `-a`, `--address`: required; target address (must be page-aligned)
  - `--reset`: reset device after writing

### `erase`

Erase device flash, starting from a specified flash address.

Supported options:

  - `-a`, `--address`: required; erase start address (must be erase-boundary-aligned)
  - `--reset`: reset device after erasing

### `reset`

Reset the device.


## TODO

  - [ ] fix progress logging architecture (need to find out how to make erase loggable)
  - [ ] CLI interface for modifying settings (+ associated flash routines etc)
    - [ ] security
    - [ ] lock regions
  - [ ] document CLI
  - [ ] document library
  - [ ] document serial transport
  - [ ] fix bug where delay is required when writing to flash (there's no delay in BOSSA)
  - [ ] investigate erase hang bug
  - [ ] investigate read hang bug
  - [ ] makefile for rebuilding applet code
