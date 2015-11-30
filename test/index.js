import assert from "power-assert";
import index from "../src";
import SeqEmitter from "../src/SeqEmitter";

describe("index", () => {
  it("exports", () => {
    assert(index === SeqEmitter);
  });
});
