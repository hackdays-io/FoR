// biome-ignore lint/style/useImportType: graph-ts mappings are compiled by AssemblyScript and require this import form.
import {
  DistributionRatioUpdated as DistributionRatioUpdatedEvent,
  TransferWithDistribution as TransferWithDistributionEvent,
} from "../generated/Router/Router";
import { DistributionRatio, Transfer, User } from "../generated/schema";

function upsertUser(address: string): void {
  let user = User.load(address);
  if (user == null) {
    user = new User(address);
    user.save();
  }
}

export function handleTransferWithDistribution(
  event: TransferWithDistributionEvent,
): void {
  const sender = event.params.sender.toHexString();
  const from = event.params.from.toHexString();
  const to = event.params.recipient.toHexString();

  upsertUser(sender);
  upsertUser(from);
  upsertUser(to);

  const id = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  const transfer = new Transfer(id);

  transfer.sender = sender;
  transfer.from = from;
  transfer.to = to;
  transfer.totalAmount = event.params.totalAmount;
  transfer.fundAmount = event.params.fundAmount;
  transfer.burnAmount = event.params.burnAmount;
  transfer.recipientAmount = event.params.recipientAmount;
  transfer.blockNumber = event.block.number;
  transfer.timestamp = event.block.timestamp;
  transfer.transactionHash = event.transaction.hash;
  transfer.logIndex = event.logIndex;

  transfer.save();
}

export function handleDistributionRatioUpdated(
  event: DistributionRatioUpdatedEvent,
): void {
  const changedBy = event.params.changedBy.toHexString();
  upsertUser(changedBy);

  const id = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  const ratio = new DistributionRatio(id);

  ratio.changedBy = changedBy;
  ratio.fundRatio = event.params.fundRatio;
  ratio.burnRatio = event.params.burnRatio;
  ratio.recipientRatio = event.params.recipientRatio;
  ratio.blockNumber = event.block.number;
  ratio.timestamp = event.block.timestamp;
  ratio.transactionHash = event.transaction.hash;
  ratio.logIndex = event.logIndex;

  ratio.save();
}
