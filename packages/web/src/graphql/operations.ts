import { gql } from '@apollo/client';

// ============================================================
// Queries
// ============================================================

export const MY_TEAMS = gql`
  query MyTeams {
    myTeams {
      id
      name
    }
  }
`;

export const TEAM_PLAYERS = gql`
  query TeamPlayers($teamId: ID!) {
    teamPlayers(teamId: $teamId) {
      id
      name
      number
      rosterEntryId
    }
  }
`;

export const TEAM_PLAYERS_FULL = gql`
  query TeamPlayersFull($teamId: ID!) {
    teamPlayersFull(teamId: $teamId) {
      id
      name
      number
      rosterEntryId
      removedAt
    }
  }
`;

export const TEAM_LINEUPS = gql`
  query TeamLineups($teamId: ID!) {
    teamLineups(teamId: $teamId) {
      id
      teamId
      gameContext {
        dateTime
        opponent
        location
        side
        notes
      }
      availablePlayerIds
      battingOrder
      innings {
        positions
        fieldConfig {
          centerField
          centerLeftField
          centerRightField
        }
      }
      status
      createdAt
      updatedAt
    }
  }
`;

// ============================================================
// Mutations
// ============================================================

export const CREATE_TEAM = gql`
  mutation CreateTeam($name: String!) {
    createTeam(name: $name) {
      id
      name
    }
  }
`;

export const CREATE_PLAYER_ON_TEAM = gql`
  mutation CreatePlayerOnTeam($teamId: ID!, $name: String!, $number: Int) {
    createPlayerOnTeam(teamId: $teamId, name: $name, number: $number) {
      id
      name
      number
      rosterEntryId
    }
  }
`;

export const REMOVE_PLAYER_FROM_TEAM = gql`
  mutation RemovePlayerFromTeam($playerId: ID!, $teamId: ID!) {
    removePlayerFromTeam(playerId: $playerId, teamId: $teamId)
  }
`;

export const SAVE_LINEUP = gql`
  mutation SaveLineup($input: SaveLineupInput!) {
    saveLineup(input: $input) {
      id
      teamId
      gameContext {
        dateTime
        opponent
        location
        side
        notes
      }
      availablePlayerIds
      battingOrder
      innings {
        positions
        fieldConfig {
          centerField
          centerLeftField
          centerRightField
        }
      }
      status
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_LINEUP = gql`
  mutation DeleteLineup($id: ID!) {
    deleteLineup(id: $id)
  }
`;
