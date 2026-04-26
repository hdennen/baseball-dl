import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamSelector from '../../components/team/TeamSelector';
import { MY_TEAMS, CREATE_TEAM } from '../../graphql/operations';
import { renderWithProviders, resetStore } from '../helpers';

beforeEach(resetStore);

const TEAMS_MOCK = {
  request: { query: MY_TEAMS },
  result: {
    data: {
      myTeams: [
        { id: 'team-1', name: 'Red Sox' },
        { id: 'team-2', name: 'Yankees' },
      ],
    },
  },
};

describe('TeamSelector', () => {
  it('renders teams from MY_TEAMS query', async () => {
    renderWithProviders(
      <TeamSelector currentTeamId={null} onTeamSelected={vi.fn()} onTeamCreated={vi.fn()} />,
      { mocks: [TEAMS_MOCK] },
    );

    await waitFor(() => {
      expect(screen.getByText('Select Team')).toBeInTheDocument();
    });
  });

  it('shows loading state while query is in flight', () => {
    renderWithProviders(
      <TeamSelector currentTeamId={null} onTeamSelected={vi.fn()} onTeamCreated={vi.fn()} />,
      { mocks: [TEAMS_MOCK] },
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error when MY_TEAMS query fails', async () => {
    const errorMock = {
      request: { query: MY_TEAMS },
      error: new Error('Network error'),
    };

    renderWithProviders(
      <TeamSelector currentTeamId={null} onTeamSelected={vi.fn()} onTeamCreated={vi.fn()} />,
      { mocks: [errorMock] },
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load teams/i)).toBeInTheDocument();
    });
  });

  it('sends CREATE_TEAM mutation with correct name variable', async () => {
    const user = userEvent.setup();
    const onTeamCreated = vi.fn();

    const createMock = {
      request: { query: CREATE_TEAM, variables: { name: 'Cubs' } },
      result: {
        data: { createTeam: { id: 'team-new', name: 'Cubs' } },
      },
    };

    renderWithProviders(
      <TeamSelector currentTeamId={null} onTeamSelected={vi.fn()} onTeamCreated={onTeamCreated} />,
      { mocks: [TEAMS_MOCK, createMock, TEAMS_MOCK] },
    );

    await waitFor(() => {
      expect(screen.getByText('Select Team')).toBeInTheDocument();
    });

    await user.click(screen.getByText('New Team'));
    const input = screen.getByLabelText('Team Name');
    await user.type(input, 'Cubs');
    await user.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(onTeamCreated).toHaveBeenCalledWith({ id: 'team-new', name: 'Cubs' });
    });
  });

  it('calls onTeamSelected when a team is chosen', async () => {
    const user = userEvent.setup();
    const onTeamSelected = vi.fn();

    renderWithProviders(
      <TeamSelector currentTeamId={null} onTeamSelected={onTeamSelected} onTeamCreated={vi.fn()} />,
      { mocks: [TEAMS_MOCK] },
    );

    await waitFor(() => {
      expect(screen.getByText('Select Team')).toBeInTheDocument();
    });

    const select = screen.getByLabelText('Team');
    await user.click(select);

    const option = await screen.findByText('Red Sox');
    await user.click(option);

    expect(onTeamSelected).toHaveBeenCalledWith('team-1', 'Red Sox');
  });
});
