import React from 'react'
import { Segment, Comment } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { setUserPosts } from '../../actions'

import MessagesHeader from './MessagesHeader'
import MessageForm from './MessageForm'
import firebase from '../../firebase'
import Message from './Message'
import Typing from './Typing'
import Skeleton from './Skeleton'

class Messages extends React.Component {
  state = {
    isPrivateChannel: this.props.isPrivateChannel,
    privateMessagesRef: firebase.database().ref('privateMessages'),
    messagesRef: firebase.database().ref('messages'),
    typingRef: firebase.database().ref('typing'),
    connectedRef: firebase.database().ref('.info/connected'), //check if user is online or not
    channel: this.props.currentChannel,
    isChannelStarred: false,
    usersRef: firebase.database().ref('users'),
    user: this.props.currentUser,
    messages: [],
    messagesLoading: true,
    numUniqueUsers: '',
    searchTerm: '',
    searchLoading: false,
    searchResults: [],
    typingUsers: [],
    listeners: []
  }

  componentDidMount() {
    const { channel, user, listeners } = this.state
    if (channel && user) {
      this.removeListeners(listeners)
      this.addMessageListeners(channel.id)
      this.addUserStarsListeners(channel.id, user.uid)
      this.addTypingListeners(channel.id, user.uid)
    }
  }

  componentWillUnmount() {
    this.removeListeners(this.state.listeners)
    this.state.connectedRef.off()
  }

  removeListeners = listeners => {
    listeners.forEach(listener => {
      listener.ref.child(listener.id).off(listener.event)
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.messageEnd) {
      this.scrollToBottom()
    }
  }

  addToListeners = (id, ref, event) => {
    const index = this.state.listeners.findIndex(listener => {
      return listener.id === id && listener.ref === ref && listener.event === event
    })

    if (index === -1) {
      const newListener = { id, ref, event }
      this.setState({listeners: this.state.listeners.concat(newListener)})
    }
  }

  scrollToBottom = () => {
    this.messageEnd.scrollIntoView({ behavior: 'smooth' })
  }

  addMessageListeners = channelId => {
    let loadedMessages = []
    let ref = this.getMessagesRef()
    ref.child(channelId).on('child_added', snap => {
      loadedMessages.push(snap.val())
      this.setState({
        messages: loadedMessages,
        messagesLoading: false
      })

      this.countUniqueUsers(loadedMessages)
      this.countUserPosts(loadedMessages)
    })
    this.addToListeners(channelId, ref, 'child_added')
  }

  addUserStarsListeners = (channelId, userId) => {
    this.state.usersRef
      .child(userId)
      .child('starred')
      .once('value')
      .then(data => {
        if (data.val() !== null) {
          const channelIds = Object.keys(data.val())
          const prevStarred = channelIds.includes(channelId)
          this.setState({ isChannelStarred: prevStarred })
        }
      })
    
  }

  addTypingListeners = (channelId, userId) => {
    let typingUsers = []
    this.state.typingRef.child(channelId).on('child_added', snap => {
      if (snap.key !== userId) {
        typingUsers = typingUsers.concat({
          id: snap.key,
          name: snap.val()
        })
        this.setState({ typingUsers })
      }
    })
    this.addToListeners(channelId, this.state.typingRef, 'child_added')

    this.state.typingRef.child(channelId).on('child_removed', snap => {
      const index = typingUsers.findIndex(user => user.id === snap.key)
      if (index !== -1) {
        typingUsers = typingUsers.filter(user => user.id !== snap.key)
        this.setState({ typingUsers })
      }
    })
    this.addToListeners(channelId, this.state.typingRef, 'child_removed')

    this.state.connectedRef.on('value', snap => {
      if (snap.val() === true) {
        this.state.typingRef
          .child(channelId)
          .child(this.state.user.uid)
          .onDisconnect()
          .remove(err => {
            if (err !== null) {
              console.log(err)
            }
          })
      }
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
    this.setState({ numUniqueUsers })
  }

  countUserPosts = messages => {
    let userPosts = messages.reduce((acc, message) => {
      if (message.user.name in acc) {
        acc[message.user.name].count += 1
      } else {
        acc[message.user.name] = {
          avatar: message.user.avatar,
          count: 1
        }
      }
      return acc
    }, {})
    this.props.setUserPosts(userPosts)
  }

  displayMessages = messages => (
    messages.length > 0 && messages.map(message => (
      <Message message={message} user={this.state.user} key={message.timestamp} />
    ))
  )

  displayTypingUsers = users => (
    users.length > 0 && users.map(user => (
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "0.2em" }}
        key={user.id}
      >
        <span className="user__typing">{user.name} is typing</span> <Typing />
      </div>
    ))
  )

  getMessagesRef = () => {
    const { messagesRef, privateMessagesRef, isPrivateChannel } = this.state
    return isPrivateChannel ? privateMessagesRef : messagesRef
  }

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
    setTimeout(() => this.setState({ searchLoading: false }), 1000)
  }

  displayChannelName = channel => channel ? `${this.state.isPrivateChannel ? '@' : '#'}${channel.name}` : ''

  handleStar = () => {
    this.setState(prevState => ({
      isChannelStarred: !prevState.isChannelStarred
    }), () => this.starChannel())
  }

  starChannel = () => {
    console.log("console", this.state.isChannelStarred)
    if (this.state.isChannelStarred) {
      this.state.usersRef
        .child(`${this.state.user.uid}/starred`)
        .update({
          [this.state.channel.id]: {
            name: this.state.channel.name,
            details: this.state.channel.details,
            createdBy: {
              name: this.state.channel.createdBy.name,
              avatar: this.state.channel.createdBy.avatar
            }
          }
        })
    } else {
      this.state.usersRef
        .child(`${this.state.user.uid}/starred`)
        .child(this.state.channel.id)
        .remove(err => {
          if (err !== null) {
            console.error(err)
          }
        })
    }
  }

  displayMessagesSkeleton = loading => (
    loading ? (
      <React.Fragment>
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} />
        ))}
      </React.Fragment>
    ) : null
  )

  render() {
    const { channel, user, messages, numUniqueUsers, searchTerm,
      searchLoading, searchResults, isPrivateChannel, isChannelStarred, typingUsers, messagesLoading } = this.state
    return (
      <React.Fragment>
        <MessagesHeader
          channelName={this.displayChannelName(channel)}
          numUniqueUsers={numUniqueUsers}
          handleSearchChange={this.handleSearchChange}
          searchLoading={searchLoading}
          isPrivateChannel={isPrivateChannel}
          handleStar={this.handleStar}
          isChannelStarred={isChannelStarred}
        />

        <Segment>
          <Comment.Group className="messages">
            {this.displayMessagesSkeleton(messagesLoading)}
            {this.displayMessages(searchTerm ? searchResults : messages)}
            {this.displayTypingUsers(typingUsers)}
            <div ref={node=> (this.messageEnd = node)} />
          </Comment.Group>
        </Segment>

        <MessageForm
          currentChannel={channel}
          currentUser={user}
          isPrivateChannel={isPrivateChannel}
          getMessagesRef={this.getMessagesRef}
        />
      </React.Fragment>
    )
  }
}

export default connect(null, {setUserPosts})(Messages);