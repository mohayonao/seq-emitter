import IntervalIterator from "interval-iterator";

export default class TrackIterator extends IntervalIterator {
  constructor(iter, interval, trackNumber) {
    super(iter, interval);

    this.trackNumber = trackNumber;
    this.done = false;
  }
}
