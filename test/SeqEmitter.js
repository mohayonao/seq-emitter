import assert from "power-assert";
import sinon from "sinon";
import tickable from "tickable-timer";
import WebAudioScheduler from "web-audio-scheduler";
import SeqEmitter from "../src/SeqEmitter";

describe("SeqEmitter", () => {
  let BuiltInDate = Date;
  let warn = global.console.warn;
  let timestamp = 0;

  before(() => {
    BuiltInDate = global.Date;

    global.Date = {
      now: () => timestamp,
    };
    global.console.warn = () => {};
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
    global.console.warn = warn;
  });

  describe("constructor(tracks: Iterator[], config = {})", () => {
    it("works", () => {
      let emitter = new SeqEmitter([]);

      assert(emitter instanceof SeqEmitter);
    });
  });
  describe("#scheduler: string", () => {
    it("works", () => {
      let emitter = new SeqEmitter([]);

      assert(emitter.scheduler instanceof WebAudioScheduler);
    });
    it("works with given scheduler", () => {
      let scheduler = new WebAudioScheduler({ timerAPI: tickable });
      let emitter = new SeqEmitter([], { scheduler: scheduler });

      assert(emitter.scheduler === scheduler);
    });
  });
  describe("#state: string", () => {
    it("works", () => {
      let emitter = new SeqEmitter([]);

      assert(emitter.state === "suspended");
    });
  });
  describe("#start([ t0: number ]): void", () => {
    it("works", () => {
      let emitter = new SeqEmitter([], { timerAPI: tickable });

      emitter.scheduler.start = sinon.spy();

      emitter.start();

      assert(emitter.scheduler.start.callCount === 1);
      assert(emitter.scheduler.events.length === 1);
    });
    it("not work for call more than once", () => {
      let emitter = new SeqEmitter([], { timerAPI: tickable });

      emitter.scheduler.start = sinon.spy();

      emitter.start();
      emitter.start();

      assert(emitter.scheduler.start.callCount === 1);
      assert(emitter.scheduler.events.length === 1);
    });
    it("works with given scheduler", () => {
      let scheduler = new WebAudioScheduler({ timerAPI: tickable });
      let emitter = new SeqEmitter([], { scheduler: scheduler });

      scheduler.start = sinon.spy(scheduler.start.bind(scheduler));

      emitter.start();

      assert(emitter.scheduler.start.callCount === 0);
      assert(emitter.scheduler.events.length === 1);
    });
  });
  describe("#stop([ t0: number ]): void", () => {
    it("works", () => {
      let emitter = new SeqEmitter([], { timerAPI: tickable });

      emitter.scheduler.start = sinon.spy(emitter.scheduler.start.bind(emitter.scheduler));
      emitter.scheduler.stop = sinon.spy(emitter.scheduler.stop.bind(emitter.scheduler));

      emitter.start();
      emitter.stop();

      assert(emitter.scheduler.stop.callCount === 0);
      assert(emitter.scheduler.events.length === 2);

      tickable.tick(1000);

      assert(emitter.scheduler.stop.callCount === 1);
      assert(emitter.scheduler.events.length === 0);
    });
    it("not work without start", () => {
      let emitter = new SeqEmitter([], { timerAPI: tickable });

      emitter.scheduler.start = sinon.spy(emitter.scheduler.start.bind(emitter.scheduler));
      emitter.scheduler.stop = sinon.spy(emitter.scheduler.stop.bind(emitter.scheduler));

      emitter.stop();

      assert(emitter.scheduler.stop.callCount === 0);
      assert(emitter.scheduler.events.length === 0);
    });
    it("not work for call more than once", () => {
      let emitter = new SeqEmitter([], { timerAPI: tickable });

      emitter.scheduler.start = sinon.spy(emitter.scheduler.start.bind(emitter.scheduler));
      emitter.scheduler.stop = sinon.spy(emitter.scheduler.stop.bind(emitter.scheduler));

      emitter.start();
      emitter.stop();
      emitter.stop();

      assert(emitter.scheduler.stop.callCount === 0);
      assert(emitter.scheduler.events.length === 2);

      tickable.tick(1000);

      assert(emitter.scheduler.stop.callCount === 1);
      assert(emitter.scheduler.events.length === 0);
    });
    it("works with given scheduler", () => {
      let scheduler = new WebAudioScheduler({ timerAPI: tickable });
      let emitter = new SeqEmitter([], { scheduler: scheduler });

      scheduler.start = sinon.spy(scheduler.start.bind(scheduler));
      scheduler.stop = sinon.spy(scheduler.stop.bind(scheduler));

      emitter.start();

      assert(emitter.scheduler.start.callCount === 0);
      assert(emitter.scheduler.events.length === 1);

      scheduler.start();

      emitter.stop();

      assert(emitter.scheduler.stop.callCount === 0);
      assert(emitter.scheduler.events.length === 2);

      tickable.tick(1000);

      assert(emitter.scheduler.stop.callCount === 0);
      assert(emitter.scheduler.events.length === 0);
    });
  });
  describe("emit events", () => {
    it("works", () => {
      let tracks = [
        [
          { type: "note", time: 0.00, noteNumber: 60 },
          { type: "note", time: 0.50, noteNumber: 64 },
          { type: "note", time: 1.00, noteNumber: 67 },
          { type: "ctrl", time: 1.25 },
          { type: "end", time: 1.5 },
        ],
        [
          { type: "note", time: 0.00, noteNumber: 57 },
          { type: "note", time: 0.25, noteNumber: 57 },
          { type: "note", time: 0.50, noteNumber: 57 },
          { type: "note", time: 1.00, noteNumber: 55 },
          { time: 1.5 },
        ],
      ].map(track => track[Symbol.iterator]());

      let emitter = new SeqEmitter(tracks, { timerAPI: tickable, interval: 0.25 });
      let onStateChange = sinon.spy();
      let onNote = sinon.spy();
      let onCtrl = sinon.spy();
      let onEnd = sinon.spy();
      let onEndAll = sinon.spy();

      function resetSpies() {
        onStateChange.reset();
        onNote.reset();
        onCtrl.reset();
        onEnd.reset();
        onEndAll.reset();
      }

      emitter.on("statechange", onStateChange);
      emitter.on("note", onNote);
      emitter.on("ctrl", onCtrl);
      emitter.on("end", onEnd);
      emitter.on("end:all", onEndAll);
      emitter.start(1);
      emitter.stop(3);

      tickable.tick(1000);
      assert(onStateChange.callCount === 1);
      assert(onNote.callCount === 2);
      assert(onCtrl.callCount === 0);
      assert(onEnd.callCount === 0);
      assert(onEndAll.callCount === 0);
      assert.deepEqual(onStateChange.args[0][0], { type: "statechange", playbackTime: 1, state: "running" });
      assert.deepEqual(onNote.args[0][0], { type: "note", playbackTime: 1.000, trackNumber: 0, time: 0.000, noteNumber: 60 });
      assert.deepEqual(onNote.args[1][0], { type: "note", playbackTime: 1.000, trackNumber: 1, time: 0.000, noteNumber: 57 });
      resetSpies();

      tickable.tick(250);
      assert(onStateChange.callCount === 0);
      assert(onNote.callCount === 1);
      assert(onCtrl.callCount === 0);
      assert(onEnd.callCount === 0);
      assert(onEndAll.callCount === 0);
      assert.deepEqual(onNote.args[0][0], { type: "note", playbackTime: 1.250, trackNumber: 1, time: 0.250, noteNumber: 57 });
      resetSpies();

      tickable.tick(250);
      assert(onStateChange.callCount === 0);
      assert(onNote.callCount === 2);
      assert(onCtrl.callCount === 0);
      assert(onEnd.callCount === 0);
      assert(onEndAll.callCount === 0);
      assert.deepEqual(onNote.args[0][0], { type: "note", playbackTime: 1.500, trackNumber: 0, time: 0.500, noteNumber: 64 });
      assert.deepEqual(onNote.args[1][0], { type: "note", playbackTime: 1.500, trackNumber: 1, time: 0.500, noteNumber: 57 });
      resetSpies();

      tickable.tick(250);
      assert(onStateChange.callCount === 0);
      assert(onNote.callCount === 0);
      assert(onCtrl.callCount === 0);
      assert(onEnd.callCount === 0);
      assert(onEndAll.callCount === 0);
      resetSpies();

      tickable.tick(250);
      assert(onStateChange.callCount === 0);
      assert(onNote.callCount === 2);
      assert(onCtrl.callCount === 0);
      assert(onEnd.callCount === 0);
      assert(onEndAll.callCount === 0);
      assert.deepEqual(onNote.args[0][0], { type: "note", playbackTime: 2.000, trackNumber: 0, time: 1.000, noteNumber: 67 });
      assert.deepEqual(onNote.args[1][0], { type: "note", playbackTime: 2.000, trackNumber: 1, time: 1.000, noteNumber: 55 });
      resetSpies();

      tickable.tick(250);
      assert(onStateChange.callCount === 0);
      assert(onNote.callCount === 0);
      assert(onCtrl.callCount === 1);
      assert(onEnd.callCount === 0);
      assert(onEndAll.callCount === 0);
      assert.deepEqual(onCtrl.args[0][0], { type: "ctrl", playbackTime: 2.250, trackNumber: 0, time: 1.250 });
      resetSpies();

      tickable.tick(250);
      assert(onStateChange.callCount === 0);
      assert(onNote.callCount === 0);
      assert(onCtrl.callCount === 0);
      assert(onEnd.callCount === 1);
      assert.deepEqual(onEnd.args[0][0], { type: "end", playbackTime: 2.5, trackNumber: 0, time: 1.5 });
      resetSpies();

      tickable.tick(250);
      assert(onStateChange.callCount === 0);
      assert(onNote.callCount === 0);
      assert(onCtrl.callCount === 0);
      assert(onEnd.callCount === 0);
      assert(onEndAll.callCount === 1);
      assert.deepEqual(onEndAll.args[0][0], { type: "end:all", playbackTime: 2.75 });
      resetSpies();

      tickable.tick(250);
      assert(onStateChange.callCount === 1);
      assert(onNote.callCount === 0);
      assert(onCtrl.callCount === 0);
      assert(onEnd.callCount === 0);
      assert(onEndAll.callCount === 0);
      assert.deepEqual(onStateChange.args[0][0], { type: "statechange", playbackTime: 3, state: "closed" });
    });
  });
});
