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
    this._startTime = 0;
    this._timerId = 0;
  }

  start(t0 = this._scheduler.currentTime) {
    this._startTime = t0;
    this._scheduler.start();
    this._timerId = this._scheduler.insert(t0, (e) => {
      this._process(e.playbackTime);
    });
  }

  stop(t0 = this._scheduler.currentTime) {
    this._scheduler.insert(t0, () => {
      this._scheduler.stop();
      this._scheduler.remove(this._timerId);
      this._timerId = 0;
    });
  }

  _process(playbackTime) {
    this._tracks.forEach((iter) => {
      let iterItem = iter.next();

      this._emitEvent(iterItem.value, iter.trackNumber);

      if (iterItem.done) {
        iter.done = true;
      }
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
