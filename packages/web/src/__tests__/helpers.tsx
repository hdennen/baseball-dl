import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockedResponse } from '@apollo/client/testing/core';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import useBaseballStore from '../store/useBaseballStore';

const theme = createTheme();

interface WrapperOptions {
  mocks?: MockedResponse[];
  route?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: WrapperOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { mocks = [], route = '/', ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[route]}>
            {children}
          </MemoryRouter>
        </ThemeProvider>
      </MockedProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export function resetStore() {
  useBaseballStore.getState().clearAllData();
  useBaseballStore.setState({
    currentTeamId: null,
    currentTeamName: null,
  });
}
