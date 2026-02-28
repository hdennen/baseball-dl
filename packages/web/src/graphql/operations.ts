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
