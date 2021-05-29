import firebase from '../../firebase'
import React from 'react'
import { Menu, Icon, Modal, Form, Input, Button, Label } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { setCurrentChannel, setPrivateChannel } from '../../actions'

class Channels extends React.Component {
  state = {
    activeChannel: '',
    user: this.props.currentUser,
    channel: null,
    channels: [],
    channelName: '',
    channelDetails: '',
    channelsRef: firebase.database().ref("channels"),
    messagesRef: firebase.database().ref('messages'),
    typingRef: firebase.database().ref('typing'),
    notifications: [],
    modal: false,
    firstLoad: true
  }

  componentDidMount() {
    this.addListeners()
  }

  componentWillUnmount() {
    this.removeListeners()
  }

  addListeners = () => {
    let loadedChannels = []
    this.state.channelsRef.on('child_added', snap => {
      loadedChannels.push(snap.val())
      this.setState({ channels: loadedChannels }, () => this.setFirstChannel())
      this.addNotificationListener(snap.key)
    })
  }

  //listen to messages added in channels
  addNotificationListener = (channelId) => {
    this.state.messagesRef.child(channelId).on('value', snap => {

      if (this.state.channel) {
        this.handleNotifications(channelId, this.state.channel.id, this.state.notifications, snap)
      }
    })
  }

  handleNotifications = (channelId, currentChannelId, notifications, snap) => {
    let lastTotal = 0
    let index = notifications.findIndex(notification => notification.id === channelId)
    if (index !== -1) {
      if (channelId !== currentChannelId) {
        console.log("notification added")
        lastTotal = notifications[index].total

        if (snap.numChildren() - lastTotal > 0) {
          notifications[index].count = snap.numChildren() - lastTotal
        }
      }
      notifications[index].lastKnownTotal = snap.numChildren()
    } else {
      notifications.push({
        id: channelId,
        total: snap.numChildren(),
        lastKnownTotal: snap.numChildren(),
        count: 0
      })
    }

    this.setState({notifications})
  }

  removeListeners = () => {
    this.state.channelsRef.off()
  }

  setFirstChannel = () => {
    const firstChannel = this.state.channels[0]
    if (this.state.firstLoad && this.state.channels.length > 0) {
      this.props.setCurrentChannel(firstChannel)
      // this.props.setPrivateChannel(false)
      this.setActiveChannel(firstChannel)
      this.setState({channel: firstChannel})
    }
    this.setState({firstLoad: false }) 
  }

  openModal = () => this.setState({modal: true})
  closeModal = () => this.setState({ modal: false })
  handleChange = e => this.setState({ [e.target.name]: e.target.value })
  
  handleSubmit = e => {
    e.preventDefault()
    if (this.isFormValid(this.state)) {
      this.addChannel()
    }
  }

  isFormValid = ({ channelName, channelDetails }) => channelName && channelDetails
  
  addChannel = () => {
    const { channelsRef, channelName, channelDetails, user} = this.state
    const key = channelsRef.push().key

    const newChannel = {
      id: key,
      name: channelName,
      details: channelDetails,
      createdBy: {
        name: user.displayName,
        avatar: user.photoURL
      }
    }

    channelsRef
      .child(key)
      .update(newChannel)
      .then(() => {
        this.setState({ channelName: '', channelDetails: '' })
        this.closeModal()
        console.log('channel added')
      })
      .catch(err => {
        console.log(err)
      })
  }

  setActiveChannel = (channel) => this.setState({activeChannel: channel.id})

  changeChannel = channel => {
    this.setActiveChannel(channel)
    this.state.typingRef.child(this.state.channel.id).child(this.state.user.uid).remove() //remove typing
    this.clearNotifications()
    this.props.setCurrentChannel(channel)
    this.props.setPrivateChannel(false)
    this.setState({ channel })
  }

  clearNotifications() {
    let index = this.state.notifications.findIndex(notification => notification.id === this.state.channel.id)
    if (index !== -1) {
      let updatedNotifications = [...this.state.notifications]
      updatedNotifications[index].total = this.state.notifications[index].lastKnownTotal
      updatedNotifications[index].count = 0
      this.setState({notifications: updatedNotifications})
    }
  }

  getNotificationCount = channel => {
    let count = 0
    this.state.notifications.forEach(notification => {
      if (notification.id === channel.id) {
        count = notification.count
      }
    })
    if(count > 0) return count
  }

  displayChannels = channels => channels.map(channel => (
    <Menu.Item
      key={channel.id}
      onClick={() => this.changeChannel(channel)}
      name={channel.name}
      style={{ opacity: 0.7 }}
      active={channel.id === this.state.activeChannel}
    >
      {this.getNotificationCount(channel) && (
        <Label color="red">{this.getNotificationCount(channel)}</Label>
      )}
      # {channel.name}
    </Menu.Item>
  ))

  render() {
    const { channels, modal } = this.state
    
    return (
      <React.Fragment>
        {/* Channels */}
        <Menu.Menu className="menu">
          <Menu.Item>
            <span>
              <Icon name="exchange"/> CHANNELS
            </span>
            ({channels.length}) <Icon name="add" onClick={this.openModal}/>
          </Menu.Item>
        </Menu.Menu>
        {channels.length > 0 && this.displayChannels(channels)}

        {/* Add channel modal */}
        <Modal basic open={modal} onClose={this.closeModal}>
          <Modal.Header>Add a Channel</Modal.Header>
          <Modal.Content>
            <Form onSubmit={this.handleSubmit}>
              <Form.Field>
                <Input
                  fluid
                  label="Name of Channel"
                  name="channelName"
                  onChange={this.handleChange}
                />
              </Form.Field>
              <Form.Field>
                <Input
                  fluid
                  label="About of Channel"
                  name="channelDetails"
                  onChange={this.handleChange}
                />
              </Form.Field>
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button color="green" inverted onClick={this.handleSubmit}>
              <Icon name="checkmark"/> Add
            </Button>
            <Button color="red" inverted onClick={this.closeModal}>
              <Icon name="remove" /> Cancel
            </Button>
          </Modal.Actions>

        </Modal>
      </React.Fragment>
        
    )
  }
}

export default connect(null, {setCurrentChannel, setPrivateChannel})(Channels)