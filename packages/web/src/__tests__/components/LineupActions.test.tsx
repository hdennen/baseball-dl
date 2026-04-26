import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LineupActions from '../../components/LineupActions';
import { SAVE_LINEUP } from '../../graphql/operations';
import { renderWithProviders, resetStore } from '../helpers';
import useBaseballStore from '../../store/useBaseballStore';

beforeEach(() => {
  resetStore();
  useBaseballStore.setState({
    currentTeamId: 'team-1',
    players: [
      { id: 'p1', name: 'Alice', createdBy: 'u1', createdAt: '', updatedAt: '' },
      { id: 'p2', name: 'Bob', createdBy: 'u1', createdAt: '', updatedAt: '' },
    ],
    battingOrder: ['p1', 'p2'],
    innings: [
      {
        positions: { pitcher: 'p1', catcher: 'p2' },
        fieldConfig: {
          'center-field': true,
          'center-left-field': false,
          'center-right-field': false,
        },
      },
    ],
    gameContext: {
      date: '2026-06-15',
      time: '18:30',
      opponent: 'Mets',
      location: 'Field 3',
      side: 'home',
      notes: null,
    },
  });
});

describe('LineupActions', () => {
  it('shows Unsaved status when no lineup is loaded', () => {
    renderWithProviders(<LineupActions />, { mocks: [] });
    expect(screen.getByText('Unsaved')).toBeInTheDocument();
  });

  it('shows Draft status when lineup is saved as draft', () => {
    useBaseballStore.setState({
      currentLineupId: 'lineup-1',
      currentLineupStatus: 'draft',
    });

    renderWithProviders(<LineupActions />, { mocks: [] });
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('shows Published status and hides Save/Publish buttons', () => {
    useBaseballStore.setState({
      currentLineupId: 'lineup-1',
      currentLineupStatus: 'published',
    });

    renderWithProviders(<LineupActions />, { mocks: [] });
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.queryByText('Save Draft')).not.toBeInTheDocument();
    expect(screen.queryByText('Publish')).not.toBeInTheDocument();
    expect(screen.getByText('Duplicate as Draft')).toBeInTheDocument();
  });

  it('sends SAVE_LINEUP mutation with correctly transformed fieldConfig', async () => {
    const user = userEvent.setup();

    const saveMock = {
      request: {
        query: SAVE_LINEUP,
        variables: {
          input: {
            teamId: 'team-1',
            gameContext: {
              dateTime: '2026-06-15T18:30:00',
              opponent: 'Mets',
              location: 'Field 3',
              side: 'home',
              notes: null,
            },
            availablePlayerIds: ['p1', 'p2'],
            battingOrder: ['p1', 'p2'],
            innings: [
              {
                positions: { pitcher: 'p1', catcher: 'p2' },
                fieldConfig: {
                  centerField: true,
                  centerLeftField: false,
                  centerRightField: false,
                },
              },
            ],
            status: 'draft',
          },
        },
      },
      result: {
        data: {
          saveLineup: { id: 'saved-lineup-1', status: 'draft' },
        },
      },
    };

    renderWithProviders(<LineupActions />, { mocks: [saveMock] });

    await user.click(screen.getByText('Save Draft'));

    await waitFor(() => {
      expect(screen.getByText('Lineup saved as draft')).toBeInTheDocument();
    });

    expect(useBaseballStore.getState().currentLineupId).toBe('saved-lineup-1');
    expect(useBaseballStore.getState().currentLineupStatus).toBe('draft');
  });
});
