/**
 * Created by jonas on 2/25/17.
 */
import React, { PropTypes } from 'react';

class Action extends React.Component{
  static displayName = 'SocketAction';
  static contextTypes = {
    socket: PropTypes.shape({
      subscribe: PropTypes.func.isRequired,
      send: PropTypes.func.isRequired
    }).isRequired
  };
  static propTypes = {
    route: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.array
    ]).isRequired,
    condition: PropTypes.any,
    once: PropTypes.any,
    action: PropTypes.func.isRequired
  };

  componentWillMount(){
    const {socket} = this.context;
    const {route} = this.props;
    this.unsub = socket.subscribe(route, (res) => {this.executeAction(res)});
  }

  componentWillReceiveProps(){
    if(this.actions && this.actions.length){
      this.actions.forEach(action => this.executeAction(this.actions.shift()))
    }
  }

  executeAction(data){
    const hasCondition = 'condition' in this.props;
    const {action, once, condition} = this.props;
    if(this.firedOnce && once){
      return;
    }
    if(once && this.unsub){
      this.unsub();
      this.unsub = null;
    }
    if((hasCondition && Boolean(condition))|| !hasCondition){
      action(data);
      this.firedOnce = true;
    } else {
      this.actions = this.actions ? this.actions.concat([data]) : [data];
    }
  }

  componentWillUnmount(){
    if(this.unsub){
      this.unsub()
    }
  }

  render(){
    return null;
  }
}

export default Action;