import firebase from '../../firebase'
import React from 'react'
import { Menu, Icon, Modal, Form, Input, Button } from 'semantic-ui-react'
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
      this.setState({channels: loadedChannels}, () => this.setFirstChannel())
    })
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
    }
    this.setState({firstLoad: false})
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
    this.props.setCurrentChannel(channel)
    this.props.setPrivateChannel(false)
    this.setState({channel})
  }

  displayChannels = channels => channels.map(channel => (
    <Menu.Item
      key={channel.id}
      onClick={() => this.changeChannel(channel)}
      name={channel.name}
      style={{ opacity: 0.7 }}
      active={channel.id === this.state.activeChannel}
    >
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