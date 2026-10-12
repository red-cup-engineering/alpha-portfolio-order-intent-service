import { semanticIdOf } from "@red-cup-engineering/computer-content-address-engineering-services-section/semantic-content-identity";
import { allocationFor } from '@red-cup-engineering/mandate-portfolio-allocation-service/market-game';

const semanticId = semanticIdOf("brokerage.alpha-portfolio-order-intent.record");

const id = (v) => semanticId(v);
const positive = (v, label) => { const n = Number(v); if (!Number.isFinite(n) || n <= 0) throw new TypeError(`${label}-invalid`); return n; };
export function validateAggressivePortfolioIntentRequest({ contract, evidencePackets, symbol, side = "buy", notional, maximumLoss, thesis, falsifier, liquidityPremise, executionPremise, scenarios, strategyCandidate, promotionCertificate, marketDecision, asOf = new Date().toISOString() } = {}) {
  if (contract?.type !== "PrincipalBrokerageServiceContract" || !contract.scopes?.includes("orders:intent")) throw new TypeError("order-intent-contract-required");
  if (!Array.isArray(evidencePackets) || evidencePackets.length === 0 || evidencePackets.some((p) => p?.type !== "IssuerEvidencePacket")) throw new TypeError("issuer-evidence-required");
  if (typeof symbol !== "string" || !/^[A-Z0-9][A-Z0-9.^/-]*$/i.test(symbol.trim())) throw new TypeError("instrument-symbol-invalid");
  if (side !== "buy" && side !== "sell") throw new TypeError("order-side-invalid");
  if (evidencePackets.some((p) => typeof p.ticker !== "string" || p.ticker.trim().toUpperCase() !== symbol.trim().toUpperCase())) throw new TypeError("issuer-evidence-instrument-mismatch");
  const n = positive(notional, "notional"), loss = positive(maximumLoss, "maximum-loss");
  if (marketDecision && (side !== 'buy' || Math.ceil(n * 100 - 1e-9) > allocationFor(marketDecision, { venue: 'alpaca', principal: contract.principal, instrument: String(symbol).toUpperCase(), side: 'long', at: asOf }))) throw new RangeError('order-exceeds-shared-market-allocation');
  if (n > contract.risk.maximumOrderNotional || loss > contract.risk.maximumLossAmount || n / contract.capital.amount > contract.risk.concentrationLimit) throw new RangeError("contract-risk-boundary-exceeded");
  if (typeof symbol !== "string" || symbol.trim() === "" || ![thesis, falsifier, liquidityPremise, executionPremise].every((x) => typeof x === "string" && x.trim()) || !Array.isArray(scenarios) || scenarios.length < 2 || scenarios.some((s) => !Number.isFinite(Number(s.pnl)))) throw new TypeError("aggressive-analysis-incomplete");
  // An order intent is a bounded proposal, not a promotion or venue effect.
  // A paper-only promotion certificate cannot establish (or prohibit) live
  // execution.  The execution transport admits the matching live authority
  // and observes the actual account immediately before placing an order.
  const worstScenarioLoss = Math.max(0, ...scenarios.map((s) => -Number(s.pnl))); if (worstScenarioLoss > loss) throw new RangeError("scenario-loss-exceeds-declared-loss");
  return Object.freeze({ contract, evidencePackets, symbol, side, notional: n, maximumLoss: loss, thesis, falsifier, liquidityPremise, executionPremise, scenarios, strategyCandidate: strategyCandidate ?? null, promotionCertificate: promotionCertificate ?? null, ...(marketDecision ? { marketDecision } : {}) });
}
export function formAggressivePortfolioIntent(input) {
  const { contract, evidencePackets, symbol, side, notional: n, maximumLoss: loss, thesis, falsifier, liquidityPremise, executionPremise, scenarios, strategyCandidate, promotionCertificate, marketDecision } = validateAggressivePortfolioIntentRequest(input);
  const body = { type: "AggressiveBrokerageOrderIntent", version: 1, contract: contract.id, evidence: evidencePackets.map((p) => p.id).sort(), symbol: String(symbol).trim().toUpperCase(), side, notional: n,
    currency: contract.capital.currency, maximumLoss: loss, concentration: n / contract.capital.amount, thesis, falsifier, liquidityPremise, executionPremise, scenarios,
    strategyCandidate, promotionCertificate, ...(marketDecision ? { marketDecision } : {}),
    effect: "intent-only", liveVenueEffect: false, policyDigest: id({ risk: contract.risk, scenarios, liquidityPremise, executionPremise, strategyCandidate, promotionCertificate: promotionCertificate?.id ?? null }) };
  return Object.freeze({ id: id(body), ...body });
}
