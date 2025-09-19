const React = require('react');

function MockLinearGradient({ children }) {
  return React.createElement(React.Fragment, null, children);
}

module.exports = { LinearGradient: MockLinearGradient };
