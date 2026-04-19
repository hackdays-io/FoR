import { graphql } from "~/gql";

export const GET_TRANSFERS_VIA_ROUTER = graphql(`
  query GetTransfersViaRouter($first: Int!, $skip: Int!, $orderDirection: OrderDirection!) {
    transferViaRouters(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: $orderDirection
    ) {
      id
      sender {
        id
      }
      from {
        id
      }
      to {
        id
      }
      totalAmount
      fundAmount
      burnAmount
      recipientAmount
      timestamp
      transactionHash
      blockNumber
    }
  }
`);

export const GET_USER = graphql(`
  query GetUser($id: ID!, $first: Int!) {
    user(id: $id) {
      id
      sentTransfersViaRouter(first: $first, orderBy: timestamp, orderDirection: desc) {
        id
        sender { id }
        from { id }
        to { id }
        totalAmount
        fundAmount
        burnAmount
        recipientAmount
        timestamp
        transactionHash
        blockNumber
      }
      receivedTransfersViaRouter(first: $first, orderBy: timestamp, orderDirection: desc) {
        id
        sender { id }
        from { id }
        to { id }
        totalAmount
        fundAmount
        burnAmount
        recipientAmount
        timestamp
        transactionHash
        blockNumber
      }
    }
  }
`);

export const GET_TRANSFERS_BETWEEN = graphql(`
  query GetTransfersBetween($me: String!, $peer: String!, $first: Int!) {
    transferViaRouters(
      first: $first
      orderBy: timestamp
      orderDirection: asc
      where: {
        or: [
          { from: $me, to: $peer }
          { from: $peer, to: $me }
        ]
      }
    ) {
      id
      from { id }
      to { id }
      totalAmount
      fundAmount
      burnAmount
      recipientAmount
      timestamp
      transactionHash
      blockNumber
    }
  }
`);

export const GET_CURRENT_DISTRIBUTION_RATIO = graphql(`
  query GetCurrentDistributionRatio {
    distributionRatios(first: 1, orderBy: timestamp, orderDirection: desc) {
      id
      changedBy {
        id
      }
      fundRatio
      burnRatio
      recipientRatio
      timestamp
    }
  }
`);

export const GET_DISTRIBUTION_RATIO_HISTORY = graphql(`
  query GetDistributionRatioHistory($first: Int!, $skip: Int!) {
    distributionRatios(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      changedBy {
        id
      }
      fundRatio
      burnRatio
      recipientRatio
      blockNumber
      timestamp
      transactionHash
    }
  }
`);
