import assert from "power-assert";
import TrackIterator from "../src/TrackIterator";
import IntervalIterator from "interval-iterator";

describe("TrackIterator", () => {
  describe("constructor(iter: Iterator, interval: number, trackNumber: number)", () => {
    it("works", () => {
      let baseIter = [ 0, 0, 0 ].map(time => ({ time }))[Symbol.iterator]();
      let iter = new TrackIterator(baseIter, 1, 2);

      assert(iter instanceof IntervalIterator);
      assert(iter.trackNumber === 2);
      assert(iter.done === false);
    });
  });
});
