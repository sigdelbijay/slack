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
    messagesLoading: true,
    numUniqueUsers: '',
    searchTerm: '',
    searchLoading: false,
    searchResults: []
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
      this.countUniqueUsers(loadedMessages)
    })
  }

  countUniqueUsers = messages => {
    const uniqueUsers = messages.reduce((acc, message) => {
      if (!acc.includes(message.user.name)) {
        acc.push(message.user.name)
      }
      return acc
    }, [])

    const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0
    const numUniqueUsers = `${uniqueUsers.length} user${plural ? 's' : ''}`
    this.setState({numUniqueUsers})
  }

  displayMessages = messages => (
    messages.length > 0 && messages.map(message => (
      <Message message={message} user={this.state.user} key={message.timestamp}/>
    ))
  )

  handleSearchChange = event => {
    this.setState({
      searchTerm: event.target.value,
      searchLoading: true
    }, () => this.handleSearchMessages())
  }

  handleSearchMessages = () => {
    const channelMessages = [...this.state.messages]
    const regex = new RegExp(this.state.searchTerm, 'gi')
    const searchResults = channelMessages.reduce((acc, message) => {
      if ((message.content && message.content.match(regex)) || message.user.name.match(regex)) {
        acc.push(message)
      }
      return acc;
    }, [])
    this.setState({ searchResults })
    setTimeout(() => this.setState({searchLoading: false}), 1000)
  }

  // displayChannelName = channel => channel ? `#${channel.name}` : ''

  render() {
    const { messagesRef, channel, user, messages, numUniqueUsers, searchTerm, searchLoading, searchResults } = this.state
    return (
      <React.Fragment>
        <MessagesHeader
          channelName={channel ? `#${channel.name}` : ''}
          numUniqueUsers={numUniqueUsers}
          handleSearchChange={this.handleSearchChange}
          searchLoading={searchLoading}
        />

        <Segment>
          <Comment.Group className="messages">
            {this.displayMessages(searchTerm ? searchResults : messages)}
          </Comment.Group>
        </Segment>

        <MessageForm messagesRef={messagesRef} currentChannel={channel} currentUser={user}/>
      </React.Fragment>
    )
  }
}

export default Messages;