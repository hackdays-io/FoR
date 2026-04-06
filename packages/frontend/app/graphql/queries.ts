import { graphql } from "~/gql";

export const GET_TRANSFERS = graphql(`
  query GetTransfers($first: Int!, $skip: Int!, $orderDirection: OrderDirection!) {
    transfers(
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
      sentTransfers(first: $first, orderBy: timestamp, orderDirection: desc) {
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
      receivedTransfers(first: $first, orderBy: timestamp, orderDirection: desc) {
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
