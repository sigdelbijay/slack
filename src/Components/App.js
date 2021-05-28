import React from 'react';
import { Grid } from 'semantic-ui-react'
import './App.css';
import {connect} from 'react-redux'

import ColorPanel from './ColorPanel/ColorPanel'
import MetaPanel from './MetaPanel/MetaPanel'
import Messages from './Messages/Messages'
import SidePanel from './SidePanel/SidePanel'


const App = ({currentUser, currentChannel, isPrivateChannel, userPosts, primaryColor, secondaryColor}) => (
  <Grid columns="equal" className="app" style={{ background: secondaryColor }}>
    
    <ColorPanel currentUser={currentUser} primaryColor={primaryColor} secondaryColor={secondaryColor}/>
    <SidePanel
      key={currentUser && currentUser.uid}
      currentUser={currentUser}
      primaryColor={primaryColor}
    />
    
    <Grid.Column style = {{marginLeft: 320}}>
      <Messages
        key={currentChannel && currentChannel.id}
        currentChannel={currentChannel}
        currentUser={currentUser}
        isPrivateChannel={isPrivateChannel}
      />
    </Grid.Column>

    <Grid.Column width={4}>
      <MetaPanel
        key={currentChannel && currentChannel.id}
        isPrivateChannel={isPrivateChannel}
        currentChannel={currentChannel}
        userPosts={userPosts}
      />
    </Grid.Column>
  </Grid>
)
const mapStateToProps = state => ({
  currentUser: state.user.currentUser,
  currentChannel: state.channel.currentChannel,
  isPrivateChannel: state.channel.isPrivateChannel,
  userPosts: state.channel.userPosts,
  primaryColor: state.colors.primaryColor,
  secondaryColor: state.colors.secondaryColor
})

export default connect(mapStateToProps)(App);