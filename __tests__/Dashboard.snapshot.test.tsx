import React from 'react';
import renderer from 'react-test-renderer';
import Dashboard from '../src/screens/Dashboard.backup';

// Minimal mocks for hooks and navigation used by the Dashboard
jest.mock('../src/hooks/LoadingContext', () => ({ useLoading: () => ({ startLoading: () => {}, finishLoading: () => {}, isLoading: false }) }));
jest.mock('../src/hooks/useReminders', () => ({ useReminders: () => ({ reminders: [], loading: false, error: null, refresh: () => {}, subscribe: () => () => {} }) }));
jest.mock('../src/notifications/NotificationBell', () => {
  const React = require('react');
  return () => React.createElement('span', null);
});
jest.mock('../src/notifications/NotificationsSheet', () => {
  const React = require('react');
  return () => React.createElement('span', null);
});
jest.mock('../src/components/SkeletonImage', () => (props: any) => {
  const React = require('react');
  return React.createElement('img', { ...props, alt: 'skeleton' });
});

it('renders Dashboard snapshot', () => {
  const tree = renderer.create(<Dashboard navigation={{ navigate: () => {} }} />).toJSON();
  expect(tree).toMatchSnapshot();
});
