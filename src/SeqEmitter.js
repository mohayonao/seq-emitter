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
  }

  start() {
    this._startTime = this._scheduler.currentTime;
    this._scheduler.start((e) => {
      this._process(e.playbackTime);
    });
  }

  stop() {
    this._scheduler.stop(true);
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
      this.emit("end", { type: "end", playbackTime });
    } else {
      let nextPlaybackTime = playbackTime + this._scheduler.interval;

      this._scheduler.insert(nextPlaybackTime, (e) => {
        this._process(e.playbackTime);
      });
    }
  }

  _emitEvent(events, trackNumber) {
    events.forEach((items) => {
      let type = items.noteNumber != null ? "note" : "ctrl";
      let playbackTime = this._startTime + items.time;

      this.emit(type, assign({ type, playbackTime, trackNumber }, items));
    });
  }
}
