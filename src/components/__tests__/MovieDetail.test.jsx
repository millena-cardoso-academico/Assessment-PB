import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MovieDetail from '../MovieDetail';
import { AuthProvider } from '../../contexts/AuthContext';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as api from '../../utils/api';

vi.mock('../../utils/api', () => ({
  getMovieDetails: vi.fn(),
  getWatched: vi.fn(),
  getRating: vi.fn(),
  getFavorites: vi.fn(),
}));

const mockMovieData = {
  id: 1,
  title: 'Test Movie',
  overview: 'This is a test movie.',
  release_date: '2023-01-01',
  runtime: 120,
  genres: [{ id: 1, name: 'Action' }, { id: 2, name: 'Comedy' }],
  vote_average: 8.5,
  poster_path: '/poster1.jpg',
  credits: {
    cast: [
      { id: 101, name: 'Actor One', character: 'Hero', cast_id: 1, profile_path: '/path1.jpg' },
      { id: 102, name: 'Actor Two', character: 'Villain', cast_id: 2, profile_path: '/path2.jpg' },
    ],
  },
  videos: {
    results: [{ key: 'abcd1234' }],
  },
};

describe('MovieDetail Component', () => {
  beforeEach(() => {
    api.getMovieDetails.mockResolvedValue(mockMovieData);
    api.getWatched.mockResolvedValue([1, 2, 3]);
    api.getRating.mockResolvedValue(4);
    api.getFavorites.mockResolvedValue([1, 4, 5]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test('fetches and displays movie details', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/movie/1']}>
          <Routes>
            <Route path="/movie/:id" element={<MovieDetail />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/carregando/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /test movie/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/this is a test movie./i)).toBeInTheDocument();
    expect(screen.getByText(/action/i)).toBeInTheDocument();
    expect(screen.getByText(/comedy/i)).toBeInTheDocument();
    expect(screen.getByText(/actor one/i)).toBeInTheDocument();
    expect(screen.getByText(/actor two/i)).toBeInTheDocument();
  });
});
