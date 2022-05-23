//[assignment] write your own unit test to show that your Mastermind variation circuit is working as expected

const chai = require("chai");
const path = require("path");

const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);
const Fr = new F1Field(exports.p);
const assert = chai.assert;
const buildPoseidon = require("circomlibjs").buildPoseidon;

function bufToBn(buf) {
  let hex = [];
  const u8 = Uint8Array.from(buf);

  u8.forEach(function (i) {
    let h = i.toString(16);
    if (h.length % 2) {
      h = "0" + h;
    }
    hex.push(h);
  });

  return BigInt("0x" + hex.join(""));
}

describe("MastermindVariation", function () {
  it("proves a valid solution", async function () {
    const circuit = await wasm_tester(
      "contracts/circuits/MastermindVariation.circom"
    );
    await circuit.loadConstraints();

    const salt = bufToBn(ethers.utils.randomBytes(32));

    const poseidon = await buildPoseidon();
    const hash = poseidon.F.toObject(poseidon([salt, "1", "2", "3"]));

    const INPUT = {
      pubGuessA: 3,
      pubGuessB: 2,
      pubGuessC: 1,
      pubNumHit: 1,
      pubNumBlow: 2,
      pubSolnHash: hash,
      privSolnA: 1,
      privSolnB: 2,
      privSolnC: 3,
      privSalt: salt,
    };

    const witness = await circuit.calculateWitness(INPUT, true);

    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(Fr.eq(Fr.e(witness[1]), hash));
  });
});
