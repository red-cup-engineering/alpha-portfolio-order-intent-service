import assert from "node:assert/strict";
import test from "node:test";

import { formIssuerEvidencePacket } from "@red-cup-engineering/alpaca-services-section/evidence-packet";
import { formPrincipalBrokerageContract } from "@red-cup-engineering/principal-brokerage-interface";
import { formAggressivePortfolioIntent } from "../src/aggressive-intent.mjs";

test("issuer evidence remains content-addressed through a principal-bounded order intent", () => {
  const sourceDigest = "ni:///sha-256;AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const evidence = formIssuerEvidencePacket({
    ticker: "BLK", issuer: "BlackRock", asOf: "2099-01-01T00:00:00.000Z",
    sources: [{ uri: "https://example.test/filing", observedAt: "2099-01-01T00:00:00.000Z", digest: sourceDigest }],
    claims: [{ statement: "A bounded test claim.", sourceDigests: [sourceDigest] }],
  });
  const contract = formPrincipalBrokerageContract({
    principal: "urn:principal:test", venue: "alpaca-trading-paper", accountReference: "account:test",
    capital: { amount: 1_000, currency: "USD" },
    risk: { maximumLossAmount: 100, maximumOrderNotional: 200, maximumAggregateNotional: 400, concentrationLimit: 0.25 },
    scopes: ["orders:intent"], validUntil: "2099-01-02T00:00:00.000Z",
  });
  const intent = formAggressivePortfolioIntent({
    contract, evidencePackets: [evidence], symbol: "BLK", notional: 100, maximumLoss: 20,
    thesis: "The cited evidence supports a bounded paper intent.", falsifier: "Evidence is withdrawn.",
    liquidityPremise: "Paper execution only.", executionPremise: "No live venue effect.",
    scenarios: [{ name: "up", pnl: 10 }, { name: "down", pnl: -20 }],
  });
  assert.deepEqual(intent.evidence, [evidence.id]);
  assert.equal(intent.contract, contract.id);
  assert.equal(intent.liveVenueEffect, false);
});
