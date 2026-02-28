import gql from 'graphql-tag';

export const typeDefs = gql`
  scalar JSON

  # ============================================================
  # Enums
  # ============================================================

  enum TeamMemberRole {
    head_coach
    assistant_coach
    parent
    scorekeeper
  }

  enum LineupStatus {
    draft
    published
  }

  enum Side {
    home
    away
  }

  # ============================================================
  # Types
  # ============================================================

  type User {
    id: ID!
    email: String!
    name: String
  }

  type League {
    id: ID!
    name: String!
    seasons: [Season!]!
    createdBy: ID!
    createdAt: String!
    updatedAt: String!
  }

  type Season {
    id: ID!
    leagueId: ID
    name: String!
    startDate: String
    endDate: String
    createdBy: ID!
    createdAt: String!
    updatedAt: String!
  }

  type Team {
    id: ID!
    name: String!
    seasonId: ID
    leagueId: ID
    players: [TeamPlayer!]!
    lineups: [Lineup!]!
    members: [TeamMembership!]!
    createdBy: ID!
    createdAt: String!
    updatedAt: String!
  }

  type TeamMembership {
    id: ID!
    teamId: ID!
    userId: ID!
    role: TeamMemberRole!
    userEmail: String!
    userName: String
    createdBy: ID!
    createdAt: String!
    updatedAt: String!
  }

  type Player {
    id: ID!
    name: String!
    createdBy: ID!
    createdAt: String!
    updatedAt: String!
  }

  type RosterEntry {
    id: ID!
    playerId: ID!
    teamId: ID!
    number: Int
    createdBy: ID!
    createdAt: String!
    updatedAt: String!
  }

  type TeamPlayer {
    id: ID!
    name: String!
    number: Int
    rosterEntryId: ID!
    createdBy: ID!
    createdAt: String!
    updatedAt: String!
  }

  type PlayerRelationship {
    id: ID!
    playerId: ID!
    userId: ID!
    relationship: String!
    createdBy: ID!
    createdAt: String!
    updatedAt: String!
  }

  type GameContext {
    dateTime: String
    opponent: String
    location: String
    side: Side
    notes: String
  }

  type FieldConfig {
    centerField: Boolean!
    centerLeftField: Boolean!
    centerRightField: Boolean!
  }

  type Inning {
    positions: JSON!
    fieldConfig: FieldConfig!
  }

  type Lineup {
    id: ID!
    teamId: ID!
    gameContext: GameContext
    availablePlayerIds: [ID!]!
    battingOrder: [ID!]!
    innings: [Inning!]!
    status: LineupStatus!
    createdBy: ID!
    createdAt: String!
    updatedAt: String!
  }

  # ============================================================
  # Inputs
  # ============================================================

  input GameContextInput {
    dateTime: String
    opponent: String
    location: String
    side: Side
    notes: String
  }

  input FieldConfigInput {
    centerField: Boolean!
    centerLeftField: Boolean!
    centerRightField: Boolean!
  }

  input InningInput {
    positions: JSON!
    fieldConfig: FieldConfigInput!
  }

  input SaveLineupInput {
    id: ID
    teamId: ID!
    gameContext: GameContextInput
    availablePlayerIds: [ID!]!
    battingOrder: [ID!]!
    innings: [InningInput!]!
    status: LineupStatus
  }

  # ============================================================
  # Queries
  # ============================================================

  type Query {
    health: String!
    me: User
    myTeams: [Team!]!
    team(id: ID!): Team
    teamPlayers(teamId: ID!): [TeamPlayer!]!
    teamLineups(teamId: ID!): [Lineup!]!
    lineup(id: ID!): Lineup
  }

  # ============================================================
  # Mutations
  # ============================================================

  type Mutation {
    createTeam(name: String!, seasonId: ID, leagueId: ID): Team!
    createPlayerOnTeam(teamId: ID!, name: String!, number: Int): TeamPlayer!
    addPlayerToTeam(playerId: ID!, teamId: ID!, number: Int): RosterEntry!
    updatePlayer(id: ID!, name: String!): Player!
    updateRosterEntry(id: ID!, number: Int): RosterEntry!
    removePlayerFromTeam(playerId: ID!, teamId: ID!): Boolean!
    saveLineup(input: SaveLineupInput!): Lineup!
    deleteLineup(id: ID!): Boolean!
    addTeamMember(teamId: ID!, userId: ID!, role: TeamMemberRole!): TeamMembership!
    removeTeamMember(teamId: ID!, userId: ID!): Boolean!
    createLeague(name: String!): League!
    createSeason(leagueId: ID, name: String!, startDate: String, endDate: String): Season!
  }
`;
