import IntervalIterator from "interval-iterator";

export default class TrackIterator extends IntervalIterator {
  constructor(iter, interval, trackNumber) {
    super(iter, interval);

    this.trackNumber = trackNumber;
    this.done = false;
  }

  next() {
    if (this.done) {
      return { done: true, value: [] };
    }

    let iterItem = super.next();

    this.done = iterItem.done;

    return iterItem;
  }
}
