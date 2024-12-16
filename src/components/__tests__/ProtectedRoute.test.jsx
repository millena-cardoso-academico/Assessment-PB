import React from 'react';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '../../routes/ProtectedRoute';
import { AuthProvider } from '../../contexts/AuthContext';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

beforeAll(() => {
  delete window.location;
  window.location = { reload: vi.fn() };
});

const ProtectedComponent = () => <div>Protected Content</div>;
const LoginComponent = () => <div>Login Page</div>;

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('redirects unauthenticated users to login', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ProtectedComponent />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginComponent />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    const loginElement = await screen.findByText(/login page/i);
    expect(loginElement).toBeInTheDocument();
  });
});
