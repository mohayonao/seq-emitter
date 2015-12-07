import { EventEmitter } from "events";
import TrackIterator from "./TrackIterator";
import WebAudioScheduler from "web-audio-scheduler";
import assign from "object-assign";

export default class SeqEmitter extends EventEmitter {
  constructor(tracks, config = {}) {
    super();

    this._scheduler = config.scheduler || new WebAudioScheduler(config);
    this._tracks = tracks.map((track, trackNumber) => {
      return new TrackIterator(track, this._scheduler.interval, trackNumber);
    });
    this._startTime = -1;
    this._stopTime = -1;
    this._timerId = 0;
    this._state = "suspended";
  }

  get state() {
    return this._state;
  }

  start(t0 = this._scheduler.currentTime) {
    /* istanbul ignore else */
    if (this._startTime === -1) {
      this._startTime = t0;
      this._scheduler.start();
      this._timerId = this._scheduler.insert(t0, (e) => {
        this._state = "running";
        this.emit("statechange", { type: "statechange", playbackTime: t0, state: this._state });
        this._process(e.playbackTime);
      });
    } else {
      /* eslint no-lonely-if: 0 */
      if (this._startTime !== -1) {
        global.console.warn("Failed to execute 'start' on SeqEmitter: cannot call start more than once.");
      }
    }
  }

  stop(t0 = this._scheduler.currentTime) {
    /* istanbul ignore else */
    if (this._startTime !== -1 && this._stopTime === -1) {
      this._stopTime = t0;
      this._scheduler.insert(t0, () => {
        this._state = "closed";
        this.emit("statechange", { type: "statechange", playbackTime: t0, state: this._state });
        this._scheduler.stop();
        this._scheduler.remove(this._timerId);
        this._timerId = 0;
      });
    } else {
      if (this._startTime === -1) {
        global.console.warn("Failed to execute 'stop' on SeqEmitter: cannot call stop without calling start first.");
      }
      if (this._stopTime !== -1) {
        global.console.warn("Failed to execute 'stop' on SeqEmitter: cannot call stop more than once.");
      }
    }
  }

  _process(playbackTime) {
    this._tracks.forEach((iter) => {
      let iterItem = iter.next();

      this._emitEvent(iterItem.value, iter.trackNumber);
    });

    this._tracks = this._tracks.filter(iter => !iter.done);

    if (this._tracks.length === 0) {
      this.emit("end:all", { type: "end:all", playbackTime });
    } else {
      let nextPlaybackTime = playbackTime + this._scheduler.interval;

      this._timerId = this._scheduler.insert(nextPlaybackTime, (e) => {
        this._process(e.playbackTime);
      });
    }
  }

  _emitEvent(events, trackNumber) {
    events.forEach((items) => {
      let type = items.type;
      let playbackTime = this._startTime + items.time;

      if (typeof type === "string") {
        this.emit(type, assign({ playbackTime, trackNumber }, items));
      }
    });
  }
}
