# seq-emitter
[![Build Status](http://img.shields.io/travis/mohayonao/seq-emitter.svg?style=flat-square)](https://travis-ci.org/mohayonao/seq-emitter)
[![NPM Version](http://img.shields.io/npm/v/seq-emitter.svg?style=flat-square)](https://www.npmjs.org/package/seq-emitter)
[![License](http://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](http://mohayonao.mit-license.org/)

> EventEmitter for Web Audio API sequencer

## Installation

```
$ npm install seq-emitter
```

## API
### SeqEmitter
- `constructor(tracks: Iterator[], config = {})`
  - configuration for [WebAudioScheduler](https://github.com/mohayonao/web-audio-scheduler)
    - `config.context: AudioContext`
    - `config.interval: number`
    - `config.aheadTime: number`
    - `config.timerAPI: global`

#### Instance attribute
- `state: string`
  - `"suspended"`
  - `"running"`
  - `"closed"`

#### Instance methods
_Also implements methods from the interface [EventEmitter](https://nodejs.org/api/events.html)._

- `start([ t0: number ]): void`
- `stop([ t0: number ]): void`

#### Events
- `*` / Emitted when a scheduled item.
  - `type: string`
  - `playbackTime: number`
  - `trackNumber: number`
  - _assign properties that defined on an iterator_
- `end:all` / Emitted when all iterators will be no more data to read.
  - `type: "end:all"`
  - `playbackTime: number`
- `statechange` / Emitted when state changed.
  - `type: "statechange"`
  - `playbackTime: number`
  - `state: string`

## Examples

```js
import SeqEmitter from "seq-emitter";

let musicIterator = [
  { type: "note", time: 0.00, noteNumber:  88 },
  { type: "note", time: 0.15, noteNumber:  91 },
  { type: "note", time: 0.30, noteNumber: 100 },
  { type: "note", time: 0.45, noteNumber:  96 },
  { type: "note", time: 0.60, noteNumber:  98 },
  { type: "note", time: 0.75, noteNumber: 103 },
  { type: "end", time: 0.9 },
][Symbol.iterator]();

let audioContext = new AudioContext();
let sequencer = new SeqEmitter([ musicIterator ], { context: audioContext });

sequencer.on("note", (e) => {
  console.log(JSON.stringify(e, null, 2));
});

sequencer.start(audioContext.currentTime);
```

## License

MIT
