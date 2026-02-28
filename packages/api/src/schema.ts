import gql from 'graphql-tag';

export const typeDefs = gql`
  scalar JSON

  type Query {
    health: String!
    mySeasons: [Season!]!
    season(id: ID!): Season
  }

  type Mutation {
    createSeason(name: String!): Season!
    saveLineup(input: SaveLineupInput!): Lineup!
  }

  type Season {
    id: ID!
    name: String!
    status: String!
    lineups: [Lineup!]!
    createdAt: String!
  }

  type Lineup {
    id: ID!
    gameContext: JSON
    players: JSON!
    battingOrder: JSON!
    innings: JSON!
    createdAt: String!
  }

  input SaveLineupInput {
    id: ID
    seasonId: ID!
    gameContext: JSON
    players: JSON!
    battingOrder: JSON!
    innings: JSON!
  }
`;
