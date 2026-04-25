// biome-ignore lint/style/useImportType: graph-ts mappings are compiled by AssemblyScript and require this import form.
import { BigInt, ethereum } from "@graphprotocol/graph-ts";
// biome-ignore lint/style/useImportType: graph-ts mappings are compiled by AssemblyScript and require this import form.
import {
  AllowListAdded as AllowListAddedEvent,
  AllowListRemoved as AllowListRemovedEvent,
  Transfer as TransferEvent,
} from "../generated/FoRToken/FoRToken";
// biome-ignore lint/style/useImportType: graph-ts mappings are compiled by AssemblyScript and require this import form.
import {
  DistributionRatioUpdated as DistributionRatioUpdatedEvent,
  TransferWithDistribution as TransferWithDistributionEvent,
} from "../generated/Router/Router";
import {
  AllowedUser,
  DistributionRatio,
  Transfer,
  TransferViaRouter,
  User,
} from "../generated/schema";

function upsertUser(address: string): User {
  let user = User.load(address);
  if (user == null) {
    user = new User(address);
    user.totalTaxPaid = BigInt.zero();
    user.totalFundTaxPaid = BigInt.zero();
    user.totalBurnTaxPaid = BigInt.zero();
    user.save();
  }
  return user;
}

function upsertAllowedUser(
  account: string,
  isAllowed: boolean,
  event: ethereum.Event,
): void {
  let allowed = AllowedUser.load(account);
  if (allowed == null) {
    allowed = new AllowedUser(account);
    allowed.addedAtBlock = event.block.number;
    allowed.addedAtTimestamp = event.block.timestamp;
  }
  allowed.isAllowed = isAllowed;
  allowed.updatedAtBlock = event.block.number;
  allowed.updatedAtTimestamp = event.block.timestamp;
  allowed.updatedAtTransactionHash = event.transaction.hash;
  allowed.save();
}

export function handleTransferWithDistribution(
  event: TransferWithDistributionEvent,
): void {
  const sender = event.params.sender.toHexString();
  const from = event.params.from.toHexString();
  const to = event.params.recipient.toHexString();

  upsertUser(sender);
  const fromUser = upsertUser(from);
  upsertUser(to);

  fromUser.totalFundTaxPaid = fromUser.totalFundTaxPaid.plus(
    event.params.fundAmount,
  );
  fromUser.totalBurnTaxPaid = fromUser.totalBurnTaxPaid.plus(
    event.params.burnAmount,
  );
  fromUser.totalTaxPaid = fromUser.totalFundTaxPaid.plus(
    fromUser.totalBurnTaxPaid,
  );
  fromUser.save();

  const id = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  const transfer = new TransferViaRouter(id);

  transfer.sender = sender;
  transfer.from = from;
  transfer.to = to;
  transfer.totalAmount = event.params.totalAmount;
  transfer.fundAmount = event.params.fundAmount;
  transfer.burnAmount = event.params.burnAmount;
  transfer.recipientAmount = event.params.recipientAmount;
  transfer.message = event.params.message;
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

export function handleTransfer(event: TransferEvent): void {
  const from = event.params.from.toHexString();
  const to = event.params.to.toHexString();

  upsertUser(from);
  upsertUser(to);

  const id = `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`;
  const transfer = new Transfer(id);

  transfer.from = from;
  transfer.to = to;
  transfer.value = event.params.value;
  transfer.blockNumber = event.block.number;
  transfer.timestamp = event.block.timestamp;
  transfer.transactionHash = event.transaction.hash;
  transfer.logIndex = event.logIndex;

  transfer.save();
}

export function handleAllowListAdded(event: AllowListAddedEvent): void {
  const account = event.params.account.toHexString();
  upsertUser(account);
  upsertAllowedUser(account, true, event);
}

export function handleAllowListRemoved(event: AllowListRemovedEvent): void {
  const account = event.params.account.toHexString();
  upsertUser(account);
  upsertAllowedUser(account, false, event);
}
