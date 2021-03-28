import React from 'react'
import { Segment, Comment } from 'semantic-ui-react'

import MessagesHeader from './MessagesHeader'
import MessageForm from './MessageForm'
import firebase from '../../firebase'
import Message from './Message'


class Messages extends React.Component {
  state = {
    messagesRef: firebase.database().ref("messages"),
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    messages: [],
    messagesLoading: true
  }

  componentDidMount() {
    const { channel, user } = this.state
    if (channel && user) {
      this.addMessageListeners(channel.id)
    }
  }

  addMessageListeners = channelId => {
    let loadedMessages = []
    this.state.messagesRef.child(channelId).on('child_added', snap => {
      loadedMessages.push(snap.val())
      this.setState({
        messages: loadedMessages,
        messageLoading: false
      })
    })

  }

  displayMessages = messages => (
    messages.length > 0 && messages.map(message => (
      <Message message={message} user={this.state.user} key={message.timestamp}/>
    ))
  )

  render() {
    const { messagesRef, channel, user, messages } = this.state
    return (
      <React.Fragment>
        <MessagesHeader />

        <Segment>
          <Comment.Group className="messages">
            {this.displayMessages(messages)}
          </Comment.Group>
        </Segment>

        <MessageForm messagesRef={messagesRef} currentChannel={channel} currentUser={user}/>
      </React.Fragment>
    )
  }
}

export default Messages;