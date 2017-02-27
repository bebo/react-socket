/**
 * Created by jonas on 2/25/17.
 */

import React, { PropTypes } from 'react'

const withSocket = component => {
  return class extends React.Component{
    static displayName = `withSocket(${component.displayName || component.name})`;

    static contextTypes = {
      socket: PropTypes.shape({
        subscribe: PropTypes.func.isRequired,
        send: PropTypes.func.isRequired
      }).isRequired
    };

    render() {
      return React.createElement(component, {
        ...this.props,
        socket: this.context.socket
      })
    }
  }
};

export default withSocket;