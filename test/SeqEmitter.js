import assert from "power-assert";
import sinon from "sinon";
import tickable from "tickable-timer";
import SeqEmitter from "../src/SeqEmitter";
import _pick from "lodash.pick";

function noteEvent(playbackTime, trackNumber, time, noteNumber) {
  return { type: "note", playbackTime, trackNumber, time, noteNumber };
}

function ctrlEvent(playbackTime, trackNumber, time) {
  return { type: "ctrl", playbackTime, trackNumber, time };
}

function pick(target) {
  return _pick(target, [ "type", "playbackTime", "trackNumber", "time", "noteNumber" ]);
}

describe("SeqEmitter", () => {
  let BuiltInDate = Date;
  let timestamp = 0;

  before(() => {
    BuiltInDate = global.Date;

    global.Date = {
      now() {
        return timestamp;
      },
    };
  });
  beforeEach(() => {
    timestamp = 0;
    tickable.clearAllTimers();
    tickable.removeAllListeners();
    tickable.on("tick", (tick) => {
      timestamp += tick;
    });
  });
  after(() => {
    global.Date = BuiltInDate;
  });

  describe("constructor(tracks: Iterator[], config = {})", () => {
    it("works", () => {
      let emitter = new SeqEmitter([]);

      assert(emitter instanceof SeqEmitter);
    });
  });
  describe("#start([ t0: number ]): void", () => {
    it("works", () => {
      let emitter = new SeqEmitter([], { timerAPI: tickable });

      assert.doesNotThrow(() => {
        emitter.start();
      });
    });
  });
  describe("#stop([ t0: number ]): void", () => {
    it("works", () => {
      let emitter = new SeqEmitter([], { timerAPI: tickable });

      assert.doesNotThrow(() => {
        emitter.stop();
      });
    });
  });
  describe("emit events", () => {
    it("works", () => {
      let tracks = [
        [
          { type: "note", time: 0.00, duration: 0.5, noteNumber: 60 },
          { type: "note", time: 0.50, duration: 0.5, noteNumber: 64 },
          { type: "note", time: 1.00, duration: 0.5, noteNumber: 67 },
          { type: "ctrl", time: 1.25, duration: 0.0 },
          { type: "end", time: 1.5 },
        ],
        [
          { type: "note", time: 0.00, duration: 0.25, noteNumber: 57 },
          { type: "note", time: 0.25, duration: 0.25, noteNumber: 57 },
          { type: "note", time: 0.50, duration: 0.25, noteNumber: 57 },
          { type: "note", time: 1.00, duration: 0.25, noteNumber: 55 },
          { time: 1.5 },
        ],
      ].map(track => track[Symbol.iterator]());

      let emitter = new SeqEmitter(tracks, { timerAPI: tickable, interval: 0.25 });
      let onNote = sinon.spy();
      let onCtrl = sinon.spy();
      let onEnd = sinon.spy();
      let onEndAll = sinon.spy();

      function resetSpies() {
        onNote.reset();
        onCtrl.reset();
        onEnd.reset();
        onEndAll.reset();
      }

      emitter.on("note", onNote);
      emitter.on("ctrl", onCtrl);
      emitter.on("end", onEnd);
      emitter.on("end:all", onEndAll);
      emitter.start(1);
      emitter.stop(3);

      tickable.tick(1000);

      tickable.tick(250);
      assert(onNote.callCount === 3);
      assert(onCtrl.callCount === 0);
      assert(onEnd.callCount === 0);
      assert(onEndAll.callCount === 0);
      assert.deepEqual(pick(onNote.args[0][0]), noteEvent(1.000, 0, 0.000, 60));
      assert.deepEqual(pick(onNote.args[1][0]), noteEvent(1.000, 1, 0.000, 57));
      assert.deepEqual(pick(onNote.args[2][0]), noteEvent(1.250, 1, 0.250, 57));
      resetSpies();

      tickable.tick(250);
      assert(onNote.callCount === 2);
      assert(onCtrl.callCount === 0);
      assert(onEnd.callCount === 0);
      assert(onEndAll.callCount === 0);
      assert.deepEqual(pick(onNote.args[0][0]), noteEvent(1.500, 0, 0.500, 64));
      assert.deepEqual(pick(onNote.args[1][0]), noteEvent(1.500, 1, 0.500, 57));
      resetSpies();

      tickable.tick(250);
      assert(onNote.callCount === 0);
      assert(onCtrl.callCount === 0);
      assert(onEnd.callCount === 0);
      assert(onEndAll.callCount === 0);
      resetSpies();

      tickable.tick(250);
      assert(onNote.callCount === 2);
      assert(onCtrl.callCount === 0);
      assert(onEnd.callCount === 0);
      assert(onEndAll.callCount === 0);
      assert.deepEqual(pick(onNote.args[0][0]), noteEvent(2.000, 0, 1.000, 67));
      assert.deepEqual(pick(onNote.args[1][0]), noteEvent(2.000, 1, 1.000, 55));
      resetSpies();

      tickable.tick(250);
      assert(onNote.callCount === 0);
      assert(onCtrl.callCount === 1);
      assert(onEnd.callCount === 0);
      assert(onEndAll.callCount === 0);
      assert.deepEqual(pick(onCtrl.args[0][0]), ctrlEvent(2.250, 0, 1.250));
      resetSpies();

      tickable.tick(250);
      assert(onNote.callCount === 0);
      assert(onCtrl.callCount === 0);
      assert(onEnd.callCount === 1);
      assert.deepEqual(onEnd.args[0][0], { type: "end", playbackTime: 2.5, trackNumber: 0, time: 1.5 });
      resetSpies();

      tickable.tick(250);
      assert(onNote.callCount === 0);
      assert(onCtrl.callCount === 0);
      assert(onEnd.callCount === 0);
      assert(onEndAll.callCount === 1);
      assert.deepEqual(onEndAll.args[0][0], { type: "end:all", playbackTime: 2.75 });
      resetSpies();

      tickable.tick(250);
      assert(onNote.callCount === 0);
      assert(onCtrl.callCount === 0);
      assert(onEnd.callCount === 0);
      assert(onEndAll.callCount === 0);
    });
  });
});
