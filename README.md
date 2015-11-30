# seq-emitter
[![Build Status](http://img.shields.io/travis/mohayonao/seq-emitter.svg?style=flat-square)](https://travis-ci.org/mohayonao/seq-emitter)
[![NPM Version](http://img.shields.io/npm/v/seq-emitter.svg?style=flat-square)](https://www.npmjs.org/package/seq-emitter)
[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](http://mohayonao.mit-license.org/)

> EventEmitter for sequencer

## Installation

```
$ npm install seq-emitter
```
## API
### SeqEmitter
- `constructor(tracks: Iterator[], config = {})`

#### Instance methods
_Also implements methods from the interface [EventEmitter](https://nodejs.org/api/events.html)._

- `start(): void`
- `stop(): void`

#### Events
- `note` / Emitted when a scheduled item has `noteNumber` property.
  - `type: "note"`
  - `playbackTime: number`
  - `trackNumber: number`
  - `noteNumber: number`
  - `duration: number`
  - _assign properties that defined on an iterator_
- `ctrl` / Emitted when a scheduled item don't have `noteNumber` property.
  - `type: "ctrl"`
  - `playbackTime: number`
  - `trackNumber: number`
  - `duration: number`
  - _assign properties that defined on an iterator_
- `end` / Emitted when all iterators will be no more data to read.
  - `type: "end"`
  - `playbackTime: number`

## License

MIT
