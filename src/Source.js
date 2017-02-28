/**
 * Created by jonas on 2/25/17.
 */
import invariant from 'invariant'
import React, {Component, PropTypes} from 'react';
import {uuid} from './uuid';

import matchPath from './matchPath';

class Source extends Component{

  constructor (props, context){
    super(props, context);

    this.socket = props.socket;

    this.sendQueue = [];
    this.receiveQueue = [];
    this.subs = {};
    this.totalSubs = 0;

    this.send = this.send.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
  }

  static propTypes = {
    socket: React.PropTypes.any.isRequired,
    children: PropTypes.node
  };

  static childContextTypes = {
    socket: PropTypes.object.isRequired
  };

  getChildContext(){
    const {subscribe, send} = this;
    return {
      socket: {
        subscribe,
        send
      }
    }
  }

  componentWillMount(){
    const {children, socket} = this.props;

    invariant(
      children === null || React.Children.count(children) === 1,
      'A <Source> may have only one child element'
    );
    invariant(
      socket,
      'A <Source> must have a socket constructor'
    );

    this.socket = socket;

    if(this.socket){
      this.socket.onmessage = this.handleMessage;
      this.socket.open(() => {
        this.flushSendQueue();
        this.flushReceiveQueue();
      });
    }
  }

  componentWillUnmount(){
    if(this.socket && this.socket.onmessage){
      this.flushSendQueue();
      this.flushReceiveQueue();
      this.socket.onmessage = null;
      this.socket = null;
    }
  }

  handleMessage(messageEvent){
    if(this.socket && this.socket.readyState === this.socket.OPEN && !this.receiveQueue.length){
      if(!messageEvent.url || !this.totalSubs){return null}
      const incomingUrl = messageEvent.url;
      const registeredUrls = Object.keys(this.subs);
      const matches = registeredUrls.filter(registeredUrl => matchPath(incomingUrl, registeredUrl));
      matches.forEach(match => {
        const subs = this.subs[match];
        if(!subs || !subs.length){
          return;
        }
        subs.forEach(sub => {
          if(sub.callBack){
            sub.callBack(messageEvent);
          }
        });
      })
    } else {
      this.receiveQueue = this.receiveQueue.concat([messageEvent]);
    }
  }

  subscribe(route, callBack){
    if(Array.isArray(route)){
      const subs = route.map(singleRoute => this.subscribe(singleRoute, callBack));
      return () => {
        subs.forEach(singleSub => singleSub());
      }
    }
    const sub_id = uuid();
    if(this.routeExists(route)){
      this.subs[route] = this.subs[route].concat([{sub_id, callBack, route}])
    } else {
      this.subs[route] = [{sub_id, callBack, route}];
    }
    this.totalSubs++;
    return () => {
      this.totalSubs--;
      if(this.subs[route] && !this.subs[route].length){
        delete this.subs[route];
        return;
      }
      this.subs[route] = this.subs[route].filter(s => s.sub_id !== sub_id);
    }
  }

  routeExists(route){
    return Boolean(this.subs[route]);
  }

  send(message){
    if(this.socket && this.socket.readyState === this.socket.OPEN && !this.sendQueue.length){
      this.socket.send(message);
    } else {
      this.sendQueue = this.sendQueue.concat([message]);
    }
  }

  flushSendQueue(){
    if(this.sendQueue && this.sendQueue.length && this.socket && this.socket.readyState === this.socket.OPEN){
      for(let i=0; i < this.sendQueue.length; i++){
        const msg = this.sendQueue.shift();
        this.send(msg);
      }
    }
  }

  flushReceiveQueue(){
    if(this.sendQueue && this.receiveQueue.length && this.socket && this.socket.readyState === this.socket.OPEN){
      for(let i=0; i < this.receiveQueue.length; i++){
        const msg = this.receiveQueue.shift();
        this.send(msg);
      }
    }
  }

  render(){
    const {children} = this.props;
    return children ? React.Children.only(children) : null
  }
}

export default Source;
