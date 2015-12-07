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
  describe("#next(): { done: boolean, value: any }", () => {
    it("works", () => {
      let baseIter = [ 1, 2, 3 ].map(time => ({ time }))[Symbol.iterator]();
      let iter = new TrackIterator(baseIter, 1, 2);

      assert.deepEqual(iter.next(), { done: false, value: [] });
      assert.deepEqual(iter.next(), { done: false, value: [ { time: 1 } ] });
      assert.deepEqual(iter.next(), { done: false, value: [ { time: 2 } ] });
      assert.deepEqual(iter.next(), { done: false, value: [ { time: 3 } ] });
      assert.deepEqual(iter.next(), { done: true, value: [] });
      assert.deepEqual(iter.next(), { done: true, value: [] });
    });
  });
});
